// EncoreCapacitorPlugin.kt
// Android bridge — delegates all calls to the native encore-android-sdk.

package com.encorekit.capacitor

import com.encorekit.encore.Encore
import com.encorekit.encore.core.canonical.user.UserAttributes
import com.encorekit.encore.core.infrastructure.logging.LogLevel
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "EncoreCapacitorPlugin")
class EncoreCapacitorPlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    @Volatile private var currentDeferred: CompletableDeferred<Boolean>? = null

    // -- Configuration --

    @PluginMethod
    fun configure(call: PluginCall) {
        val apiKey = call.getString("apiKey")
        if (apiKey == null) {
            call.reject("Missing required parameter: apiKey")
            return
        }

        val logLevel = when (call.getString("logLevel")) {
            "error" -> LogLevel.ERROR
            "warn" -> LogLevel.WARN
            "info" -> LogLevel.INFO
            "debug" -> LogLevel.DEBUG
            else -> LogLevel.NONE
        }

        Encore.shared.configure(context, apiKey = apiKey, logLevel = logLevel)
        call.resolve(JSObject().put("success", true))
    }

    // -- User Identity --

    @PluginMethod
    fun identify(call: PluginCall) {
        val userId = call.getString("userId")
        if (userId == null) {
            call.reject("Missing required parameter: userId")
            return
        }

        Encore.shared.identify(userId = userId, attributes = parseAttributes(call))
        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun setUserAttributes(call: PluginCall) {
        parseAttributes(call)?.let { Encore.shared.setUserAttributes(it) }
        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun reset(call: PluginCall) {
        Encore.shared.reset()
        call.resolve(JSObject().put("success", true))
    }

    // -- Claim Control --

    @PluginMethod
    fun setClaimEnabled(call: PluginCall) {
        val enabled = call.getBoolean("enabled")
        if (enabled == null) {
            call.reject("Missing required parameter: enabled")
            return
        }

        Encore.shared.placements.isClaimEnabled = enabled
        call.resolve(JSObject().put("success", true))
    }

    // -- Offers --

    @PluginMethod
    fun show(call: PluginCall) {
        val placementId = call.getString("placementId") ?: ""
        val activity = activity
        if (activity == null) {
            call.reject("NO_ACTIVITY", "No current activity available")
            return
        }

        scope.launch {
            try {
                val result = Encore.shared.placement(placementId).show(activity)
                val obj = JSObject()
                when (result) {
                    is com.encorekit.encore.features.offers.PresentationResult.Completed -> {
                        obj.put("status", "completed")
                        obj.put("offerId", result.offerId)
                        obj.put("campaignId", result.campaignId)
                    }
                    is com.encorekit.encore.features.offers.PresentationResult.Dismissed -> {
                        obj.put("status", "dismissed")
                        obj.put("reason", result.reason.value)
                    }
                    is com.encorekit.encore.features.offers.PresentationResult.NoOffers -> {
                        obj.put("status", "no_offers")
                    }
                }
                call.resolve(obj)
            } catch (e: Exception) {
                call.reject("SHOW_FAILED", e.message, e)
            }
        }
    }

    // -- Callbacks --

    @PluginMethod
    fun registerCallbacks(call: PluginCall) {
        Encore.shared
            .onPurchaseRequest { request ->
                // Fail stale deferred so the previous purchase flow resolves
                currentDeferred?.complete(false)

                val deferred = CompletableDeferred<Boolean>()
                currentDeferred = deferred

                try {
                    notifyListeners("onPurchaseRequest", JSObject().apply {
                        put("productId", request.productId)
                        put("placementId", request.placementId)
                        put("promoOfferId", request.promoOfferId)
                    })
                } catch (_: Exception) {
                    // notifyListeners can throw during context teardown — safe to ignore
                }

                val success = deferred.await()
                currentDeferred = null

                if (!success) {
                    throw Exception("Purchase failed by JS handler")
                }
            }
            .onPurchaseComplete { result, productId ->
                notifyListeners("onPurchaseComplete", JSObject().apply {
                    put("productId", productId)
                    put("purchaseToken", result.purchaseToken)
                    put("orderId", result.orderId)
                })
            }
            .onPassthrough { placementId ->
                notifyListeners("onPassthrough", JSObject().apply {
                    put("placementId", placementId)
                })
            }

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun completePurchaseRequest(call: PluginCall) {
        val success = call.getBoolean("success") ?: false
        val deferred = currentDeferred
        if (deferred != null) {
            deferred.complete(success)
            call.resolve(JSObject().put("success", true))
        } else {
            call.resolve(JSObject().apply {
                put("success", false)
                put("error", "No pending purchase request")
            })
        }
    }

    // -- Helpers --

    private fun parseAttributes(call: PluginCall): UserAttributes? {
        val obj = call.getObject("attributes") ?: return null
        return UserAttributes(
            email = obj.optString("email", null),
            firstName = obj.optString("firstName", null),
            lastName = obj.optString("lastName", null),
            phoneNumber = obj.optString("phoneNumber", null),
            postalCode = obj.optString("postalCode", null),
            city = obj.optString("city", null),
            state = obj.optString("state", null),
            countryCode = obj.optString("countryCode", null),
            latitude = obj.optString("latitude", null),
            longitude = obj.optString("longitude", null),
            dateOfBirth = obj.optString("dateOfBirth", null),
            gender = obj.optString("gender", null),
            language = obj.optString("language", null),
            subscriptionTier = obj.optString("subscriptionTier", null),
            monthsSubscribed = obj.optString("monthsSubscribed", null),
            billingCycle = obj.optString("billingCycle", null),
            lastPaymentAmount = obj.optString("lastPaymentAmount", null),
            lastActiveDate = obj.optString("lastActiveDate", null),
            totalSessions = obj.optString("totalSessions", null),
            custom = parseCustomMap(obj),
        )
    }

    private fun parseCustomMap(obj: org.json.JSONObject): Map<String, String> {
        val customObj = obj.optJSONObject("custom") ?: return emptyMap()
        val result = mutableMapOf<String, String>()
        val keys = customObj.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            val value = customObj.optString(key, null)
            if (value != null) {
                result[key] = value
            }
        }
        return result
    }
}
