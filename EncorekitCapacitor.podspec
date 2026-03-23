require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "EncorekitCapacitor"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.0" }
  s.source       = { :git => "https://github.com/EncoreKit/capacitor-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/Sources/**/*.{swift,h,m}"

  ios_version = package["sdkVersions"]["ios"]["EncoreKit"]
  s.dependency "Capacitor"
  s.dependency "EncoreKit", ios_version

  s.swift_version = "5.9"
end
