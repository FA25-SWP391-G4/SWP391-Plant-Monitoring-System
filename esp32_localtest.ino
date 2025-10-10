#include "secrets.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "WiFi.h"
#include "DHT.h"
#include <BH1750.h>

// ----------------- PIN CONFIG -----------------
#define DHTPIN 4              // DHT22 on GPIO4
#define DHTTYPE DHT22
#define SOIL_PIN 34           // Analog soil sensor
#define WATER_PIN 35          // Water level digital sensor
#define RELAY_PIN 5           // Pump relay control
#define SDA_PIN 21            // BH1750 SDA
#define SCL_PIN 22            // BH1750 SCL

// ----------------- AWS MQTT -----------------
#define AWS_IOT_PUBLISH_TOPIC   "smartplant/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "smartplant/sub"

// ----------------- SENSOR OBJECTS -----------------
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// ----------------- AWS CLIENT -----------------
WiFiClientSecure net;
PubSubClient client(net);

// ----------------- VARIABLES -----------------
float humidity, temperature, lightLevel;
int soilPercent;
String waterStatus;
bool pumpState = false;

// Default thresholds (can be updated from AWS)
int soilThreshold = 35;      // Soil % below this triggers watering
int tempMin = 18;            // °C
int tempMax = 30;            // °C
int lightThreshold = 20000;  // lux
int humidityMax = 70;        // %

// ----------------- AWS CONNECTION -----------------
void connectAWS() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✅ Wi-Fi connected!");

  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  client.setServer(AWS_IOT_ENDPOINT, 8883);
  client.setCallback(messageHandler);

  Serial.print("Connecting to AWS IoT");
  while (!client.connect(THINGNAME)) {
    Serial.print(".");
    delay(500);
  }

  if (!client.connected()) {
    Serial.println("\n❌ AWS IoT connection failed!");
    return;
  }

  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);
  Serial.println("\n✅ Connected to AWS IoT Core!");
}

// ----------------- MESSAGE HANDLER -----------------
void messageHandler(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Message on topic: ");
  Serial.println(topic);

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.println("❌ JSON parse error!");
    return;
  }

  if (doc.containsKey("pump")) {
    String cmd = doc["pump"];
    if (cmd == "ON") {
      pumpOn();
    } else if (cmd == "OFF") {
      pumpOff();
    }
  }

  if (doc.containsKey("thresholds")) {
    JsonObject th = doc["thresholds"];
    if (th.containsKey("soil")) soilThreshold = th["soil"];
    if (th.containsKey("light")) lightThreshold = th["light"];
    if (th.containsKey("tempMin")) tempMin = th["tempMin"];
    if (th.containsKey("tempMax")) tempMax = th["tempMax"];
    if (th.containsKey("humidityMax")) humidityMax = th["humidityMax"];
    Serial.println("✅ Thresholds updated from AWS");
  }
}

// ----------------- PUMP CONTROL -----------------
void pumpOn() {
  if (waterStatus == "LOW") {
    Serial.println("⚠️  Water tank low! Pump disabled.");
    return;
  }
  digitalWrite(RELAY_PIN, HIGH);
  pumpState = true;
  Serial.println("💧 Pump ON");
}

void pumpOff() {
  digitalWrite(RELAY_PIN, LOW);
  pumpState = false;
  Serial.println("💧 Pump OFF");
}

// ----------------- SENSOR READING -----------------
void readSensors() {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  lightLevel = lightMeter.readLightLevel();

  int rawSoil = analogRead(SOIL_PIN);
  soilPercent = map(rawSoil, 4095, 0, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  int water = digitalRead(WATER_PIN);
  waterStatus = (water == HIGH) ? "OK" : "LOW";

  Serial.printf("[DHT22] T=%.1f°C, H=%.1f%%\n", temperature, humidity);
  Serial.printf("[BH1750] Light=%.1f lx\n", lightLevel);
  Serial.printf("[Soil] %d %% (raw=%d)\n", soilPercent, rawSoil);
  Serial.printf("[Water] %s\n", waterStatus.c_str());
}

// ----------------- WATERING LOGIC -----------------
void autoWaterLogic() {
  if (waterStatus == "LOW") {
    Serial.println("⚠️ Water level low — cannot water. Notifying user.");
    return;
  }

  if (soilPercent < soilThreshold) {
    Serial.println("🌱 Soil dry — activating pump cycle.");

    pumpOn();
    delay(5000); // 5 seconds watering
    pumpOff();
    delay(3000); // Wait and recheck

    readSensors();
    if (soilPercent < soilThreshold) {
      Serial.println("🔁 Soil still dry — second watering cycle.");
      pumpOn();
      delay(3000);
      pumpOff();
      delay(3000);

      readSensors();
      if (soilPercent < soilThreshold) {
        Serial.println("⚠️ Soil still dry after retries — alert user!");
      } else {
        Serial.println("✅ Soil now optimal.");
      }
    } else {
      Serial.println("✅ Soil optimal after first watering.");
    }
  }
}

// ----------------- ALERT LOGIC -----------------
void checkAlerts() {
  if (temperature < tempMin || temperature > tempMax)
    Serial.println("🌡️ Temperature out of range!");

  if (humidity > humidityMax)
    Serial.println("💦 Air humidity too high!");

  if (lightLevel > lightThreshold)
    Serial.println("☀️ Too much light exposure!");
}

// ----------------- PUBLISH DATA -----------------
void publishMessage() {
  StaticJsonDocument<512> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["light"] = lightLevel;
  doc["soil"] = soilPercent;
  doc["water"] = waterStatus;
  doc["pump"] = pumpState ? "ON" : "OFF";
  doc["thresholds"]["soil"] = soilThreshold;
  doc["thresholds"]["light"] = lightThreshold;
  doc["thresholds"]["tempMin"] = tempMin;
  doc["thresholds"]["tempMax"] = tempMax;
  doc["thresholds"]["humidityMax"] = humidityMax;
  doc["timestamp"] = millis();

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
  Serial.println("📤 Published to AWS:");
  Serial.println(jsonBuffer);
}

// ----------------- SETUP -----------------
void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  pinMode(WATER_PIN, INPUT);

  dht.begin();
  Wire.begin(SDA_PIN, SCL_PIN);
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE))
    Serial.println("✅ BH1750 ready.");
  else
    Serial.println("❌ BH1750 not detected!");

  connectAWS();
}

// ----------------- MAIN LOOP -----------------
void loop() {
  if (!client.connected()) connectAWS();
  client.loop();

  readSensors();
  autoWaterLogic();
  checkAlerts();
  publishMessage();

  delay(10000); // 10s cycle
}
