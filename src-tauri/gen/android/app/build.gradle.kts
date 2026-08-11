import java.util.Properties

fun readEnvValue(name: String): String {
    val env = Properties()
    val envFile = rootProject.file("../../../.env")
    if (envFile.exists()) {
        envFile.inputStream().use { env.load(it) }
    }
    return env.getProperty(name, System.getenv(name) ?: "")
}

fun buildConfigString(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

android {
    compileSdk = 36
    namespace = "io.enkamba.app"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "io.enkamba.app"
        minSdk = 24
        targetSdk = 36
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
        buildConfigField("String", "NATIVE_WEBRTC_TURN_HOST", buildConfigString(readEnvValue("NEXT_PUBLIC_WEBRTC_TURN_HOST")))
        buildConfigField("String", "NATIVE_WEBRTC_TURN_USERNAME", buildConfigString(readEnvValue("NEXT_PUBLIC_WEBRTC_TURN_USERNAME")))
        buildConfigField("String", "NATIVE_WEBRTC_TURN_PASSWORD", buildConfigString(readEnvValue("NEXT_PUBLIC_WEBRTC_TURN_PASSWORD")))
        buildConfigField("String", "NATIVE_WEBRTC_TURN_PORT", buildConfigString(readEnvValue("NEXT_PUBLIC_WEBRTC_TURN_PORT")))
        buildConfigField("String", "NATIVE_WEBRTC_TURNS_PORT", buildConfigString(readEnvValue("NEXT_PUBLIC_WEBRTC_TURNS_PORT")))
    }
    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("../../../android/keystore.properties")
            if (keystorePropertiesFile.exists()) {
                val keystoreProperties = Properties()
                keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
                storeFile = rootProject.file("../../../android/app/${keystoreProperties["storeFile"]}")
                storePassword = keystoreProperties["storePassword"] as String
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
            }
        }
    }
    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            isMinifyEnabled = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-process:2.10.0")
    implementation("com.google.android.gms:play-services-auth:21.4.0")
    // Versions compatibles avec le compilateur Kotlin utilise par le projet Tauri.
    implementation("com.google.firebase:firebase-auth:22.3.1")
    implementation("com.google.firebase:firebase-firestore:24.11.1")
    implementation("com.google.firebase:firebase-messaging:24.1.2")
    implementation("io.getstream:stream-webrtc-android:1.3.10")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")
