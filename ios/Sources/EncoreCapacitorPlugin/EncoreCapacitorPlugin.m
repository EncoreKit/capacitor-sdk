// EncoreCapacitorPlugin.m
// Objective-C bridge declarations for Capacitor.
// Each method here corresponds to a Swift method in EncoreCapacitorPlugin.swift.

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(EncoreCapacitorPlugin, "EncoreCapacitorPlugin",
    CAP_PLUGIN_METHOD(configure, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(identify, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setUserAttributes, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(reset, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(show, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setClaimEnabled, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(registerCallbacks, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(completePurchaseRequest, CAPPluginReturnPromise);
)
