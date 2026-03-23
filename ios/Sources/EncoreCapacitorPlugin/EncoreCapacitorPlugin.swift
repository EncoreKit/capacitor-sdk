// EncoreCapacitorPlugin.swift
// iOS bridge — delegates all calls to the native encore-swift-sdk.

import Foundation
import Capacitor
import Encore

@objc(EncoreCapacitorPlugin)
public class EncoreCapacitorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EncoreCapacitorPlugin"
    public let jsName = "EncoreCapacitorPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "identify", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setUserAttributes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reset", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setClaimEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "registerCallbacks", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "completePurchaseRequest", returnType: CAPPluginReturnPromise),
    ]

    private var currentContinuation: CheckedContinuation<Void, Error>?
    private let lock = NSLock()

    // MARK: - Configuration

    @objc func configure(_ call: CAPPluginCall) {
        guard let apiKey = call.getString("apiKey") else {
            call.reject("Missing required parameter: apiKey")
            return
        }

        let logLevel: Encore.LogLevel
        switch call.getString("logLevel") {
        case "error": logLevel = .error
        case "warn": logLevel = .warn
        case "info": logLevel = .info
        case "debug": logLevel = .debug
        default: logLevel = .none
        }

        DispatchQueue.main.async {
            Encore.shared.configure(apiKey: apiKey, logLevel: logLevel)
            call.resolve(["success": true])
        }
    }

    // MARK: - User Identity

    @objc func identify(_ call: CAPPluginCall) {
        guard let userId = call.getString("userId") else {
            call.reject("Missing required parameter: userId")
            return
        }

        let attrs = Self.parseAttributes(call.getObject("attributes"))
        Encore.shared.identify(userId: userId, attributes: attrs)
        call.resolve(["success": true])
    }

    @objc func setUserAttributes(_ call: CAPPluginCall) {
        guard let attrsObj = call.getObject("attributes") else {
            call.reject("Missing required parameter: attributes")
            return
        }

        if let attrs = Self.parseAttributes(attrsObj) {
            Encore.shared.setUserAttributes(attrs)
        }
        call.resolve(["success": true])
    }

    @objc func reset(_ call: CAPPluginCall) {
        cancelStalePurchase()
        Encore.shared.reset()
        call.resolve(["success": true])
    }

    // MARK: - Claim Control

    @objc func setClaimEnabled(_ call: CAPPluginCall) {
        guard let enabled = call.getBool("enabled") else {
            call.reject("Missing required parameter: enabled")
            return
        }

        Encore.shared.placements.isClaimEnabled = enabled
        call.resolve(["success": true])
    }

    // MARK: - Offers

    @objc func show(_ call: CAPPluginCall) {
        let placementId = call.getString("placementId")

        cancelStalePurchase()
        Task {
            do {
                let result = try await Encore.placement(placementId).show()
                switch result {
                case .granted(let entitlement):
                    call.resolve(["status": "granted", "entitlement": "\(entitlement)"])
                case .notGranted(let reason):
                    call.resolve(["status": "not_granted", "reason": reason.rawValue])
                }
            } catch {
                call.reject("SHOW_FAILED", error.localizedDescription, error)
            }
        }
    }

    // MARK: - Callbacks

    @objc func registerCallbacks(_ call: CAPPluginCall) {
        Encore.shared
            .onPurchaseRequest { [weak self] request in
                guard let self = self else { return }

                self.cancelStalePurchase()

                try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                    self.lock.lock()
                    self.currentContinuation = continuation
                    self.lock.unlock()

                    self.notifyListeners("onPurchaseRequest", data: [
                        "productId": request.productId,
                        "placementId": request.placementId as Any,
                        "promoOfferId": request.promoOfferId as Any,
                    ])
                }
            }
            .onPurchaseComplete { [weak self] transaction, productId in
                guard let self = self else { return }
                self.notifyListeners("onPurchaseComplete", data: [
                    "productId": productId,
                    "transactionId": "\(transaction.id)",
                ])
            }
            .onPassthrough { [weak self] placementId in
                guard let self = self else { return }
                self.notifyListeners("onPassthrough", data: [
                    "placementId": placementId as Any,
                ])
            }

        call.resolve(["success": true])
    }

    @objc func completePurchaseRequest(_ call: CAPPluginCall) {
        let success = call.getBool("success") ?? false

        lock.lock()
        let continuation = currentContinuation
        currentContinuation = nil
        lock.unlock()

        if let continuation {
            if success {
                continuation.resume()
            } else {
                continuation.resume(throwing: NSError(
                    domain: "EncoreCapacitorPlugin",
                    code: -2,
                    userInfo: [NSLocalizedDescriptionKey: "Purchase failed by JS handler"]
                ))
            }
            call.resolve(["success": true])
        } else {
            call.resolve(["success": false, "error": "No pending purchase request"])
        }
    }

    // MARK: - Internal

    private func cancelStalePurchase() {
        lock.lock()
        let stale = currentContinuation
        currentContinuation = nil
        lock.unlock()

        stale?.resume(throwing: NSError(
            domain: "EncoreCapacitorPlugin",
            code: -3,
            userInfo: [NSLocalizedDescriptionKey: "Superseded by new SDK action"]
        ))
    }

    // MARK: - Helpers

    private static func parseAttributes(_ dict: [String: Any]?) -> UserAttributes? {
        guard let dict = dict else { return nil }
        return UserAttributes(
            email: dict["email"] as? String,
            firstName: dict["firstName"] as? String,
            lastName: dict["lastName"] as? String,
            phoneNumber: dict["phoneNumber"] as? String,
            postalCode: dict["postalCode"] as? String,
            city: dict["city"] as? String,
            state: dict["state"] as? String,
            countryCode: dict["countryCode"] as? String,
            latitude: dict["latitude"] as? String,
            longitude: dict["longitude"] as? String,
            dateOfBirth: dict["dateOfBirth"] as? String,
            gender: dict["gender"] as? String,
            language: dict["language"] as? String,
            subscriptionTier: dict["subscriptionTier"] as? String,
            monthsSubscribed: dict["monthsSubscribed"] as? String,
            billingCycle: dict["billingCycle"] as? String,
            lastPaymentAmount: dict["lastPaymentAmount"] as? String,
            lastActiveDate: dict["lastActiveDate"] as? String,
            totalSessions: dict["totalSessions"] as? String,
            custom: dict["custom"] as? [String: String] ?? [:]
        )
    }
}
