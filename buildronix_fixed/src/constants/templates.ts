import { Cpu, Zap, Droplets, Shield, Thermometer, Wind, Eye } from 'lucide-react';

export const PREMADE_PROJECTS = [
  {
    id: "smart-irrigation",
    title: "EcoFlow Smart Irrigation",
    description: "Self-sustaining plant hydration system with moisture sensors and real-time scheduling.",
    icon: "Droplets",
    difficulty: "Beginner",
    time: "2 hours",
    components: ["Arduino Uno", "Soil Moisture Sensor", "Relay Module (1-Channel)", "OLED Display 0.96\""]
  },
  {
    id: "security-gate",
    title: "SecureSight Biometric Gate",
    description: "Multi-layered access control utilizing RFID authentication and motion-triggered alerts.",
    icon: "Shield",
    difficulty: "Advanced",
    time: "6 hours",
    components: ["ESP32", "RFID Reader (RC522)", "PIR Motion Sensor", "Servo Motor (SG90)", "Active Buzzer"]
  },
  {
    id: "env-monitor",
    title: "AtmosWatch Monitor",
    description: "Industrial-grade air quality and climate monitoring station with cloud logging.",
    icon: "Wind",
    difficulty: "Intermediate",
    time: "4 hours",
    components: ["NodeMCU", "DHT22 (Temp/Humidity)", "MQ-135 Air Quality Sensor", "OLED Display 0.96\""]
  },
  {
    id: "home-auth",
    title: "NexGen Home Hub",
    description: "Centralized smart home controller with gesture detection and atmospheric feedback.",
    icon: "Zap",
    difficulty: "Intermediate",
    time: "5 hours",
    components: ["Raspberry Pi 4", "Ultrasonic Sensor (HC-SR04)", "RGB LED", "LCD 16x2 I2C"]
  }
];
