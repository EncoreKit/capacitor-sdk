// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "EncorekitCapacitor",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "EncorekitCapacitor", targets: ["EncorekitCapacitorPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "6.0.0"),
        .package(url: "https://github.com/EncoreKit/ios-sdk-binary.git", from: "1.4.39"),
    ],
    targets: [
        .target(
            name: "EncorekitCapacitorPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Encore", package: "ios-sdk-binary"),
            ],
            path: "ios/Sources/EncoreCapacitorPlugin"
        )
    ]
)
