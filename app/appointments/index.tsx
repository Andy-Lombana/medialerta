import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export default function AddAppointmentScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [info, setInfo] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejador optimizado para la Fecha
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDate = new Date(date);
      currentDate.setFullYear(selectedDate.getFullYear());
      currentDate.setMonth(selectedDate.getMonth());
      currentDate.setDate(selectedDate.getDate());
      setDate(currentDate);
    }
  };

  // Manejador optimizado para la Hora
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentDate = new Date(date);
      currentDate.setHours(selectedTime.getHours());
      currentDate.setMinutes(selectedTime.getMinutes());
      setDate(currentDate);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !info.trim()) {
      Alert.alert("Error", "Por favor ingresa un título y una descripción corta.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Programar Notificación
      const trigger = new Date(date);
      if (trigger < new Date()) {
        Alert.alert("Error", "La fecha de la cita no puede ser en el pasado.");
        setIsSubmitting(false);
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: info,
          data: { type: 'appointment' },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: trigger, 
        },
      });

      // 2. Guardar en Storage
      const newAppointment = {
        id: notificationId,
        title,
        info,
        date: date.toISOString(),
        dateLabel: date.toLocaleDateString(),
        timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      };

      const existingData = await AsyncStorage.getItem("@medical_appointments");
      const appointments = existingData ? JSON.parse(existingData) : [];
      appointments.push(newAppointment);
      await AsyncStorage.setItem("@medical_appointments", JSON.stringify(appointments));

      Alert.alert("Éxito", "Recordatorio de cita guardado correctamente.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al guardar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <LinearGradient colors={["#1A778E", "#145269"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1A778E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Cita</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Título de la Cita</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Odontología"
          />

          <Text style={styles.label}>Información / Notas cortas</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={info}
            onChangeText={setInfo}
            placeholder="Ej: Llevar exámenes de sangre"
            multiline
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#1A778E" />
              <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#1A778E" />
              <Text style={styles.dateTimeText}>
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              {...(Platform.OS === 'ios' ? { onChange: onDateChange } : { onValueChange: onDateChange, onDismiss: () => setShowDatePicker(false) })}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={false}
              {...(Platform.OS === 'ios' ? { onChange: onTimeChange } : { onValueChange: onTimeChange, onDismiss: () => setShowTimePicker(false) })}
            />
          )}

          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>{isSubmitting ? "Guardando..." : "Guardar Recordatorio"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "white", justifyContent: "center", alignItems: "center", elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "white", marginLeft: 15 },
  content: { padding: 20 },
  formCard: { backgroundColor: "white", borderRadius: 20, padding: 20, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  label: { fontSize: 16, fontWeight: "600", color: "#444", marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: "#eee" },
  row: { flexDirection: "row", gap: 10, marginTop: 20 },
  dateTimeBtn: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", padding: 15, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: "#eee" },
  dateTimeText: { fontSize: 14, color: "#333", fontWeight: "500" },
  saveButton: { backgroundColor: "#1A778E", padding: 18, borderRadius: 15, alignItems: "center", marginTop: 30 },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});