import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { 
  addMedication, 
  getMedications, 
  updateMedication 
} from "../../utils/storage";
import {
  scheduleMedicationReminder,
  scheduleRefillReminder,
  updateMedicationReminders,
} from "../../utils/notifications";

const { width } = Dimensions.get("window");

const DURATIONS = [
  { id: "1", label: "7 days", value: 7 },
  { id: "2", label: "14 days", value: 14 },
  { id: "3", label: "30 days", value: 30 },
  { id: "4", label: "90 days", value: 90 },
  { id: "5", label: "Ongoing", value: -1 },
];

export default function AddMedicationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "Custom", // Se asigna un valor por defecto ya que eliminamos el selector
    duration: "",
    startDate: new Date(),
    times: ["09:00"], // Inicializa con una hora por defecto para que sea visible de inmediato
    notes: "",
    reminderEnabled: true,
    refillReminder: false,
    currentSupply: "",
    refillAt: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTimeIndex, setActiveTimeIndex] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadMedicationData();
    }
  }, [id]);

  const loadMedicationData = async () => {
    try {
      const medications = await getMedications();
      const med = medications.find((m) => m.id === id);
      
      if (med) {
        setForm({
          ...med,
          startDate: new Date(med.startDate),
          currentSupply: med.currentSupply?.toString() || "",
          refillAt: med.refillAt?.toString() || "",
          frequency: med.dosage,
          notes: med.notes,         
        });

        const presetDuration = DURATIONS.find(d => d.label === med.duration);
        setSelectedDuration(presetDuration ? presetDuration.label : "Custom");
      }
    } catch (error) {
      console.error("Error loading medication for edit:", error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) newErrors.name = "Medication name is required";
    if (!form.dosage.trim()) newErrors.dosage = "Dosage is required";
    if (!form.duration) newErrors.duration = "Duration is required";
    if (form.times.length === 0) {
      newErrors.times = "At least one medication time is required";
    }

    if (form.refillReminder) {
      if (!form.currentSupply) newErrors.currentSupply = "Current supply is required";
      if (!form.refillAt) newErrors.refillAt = "Refill alert threshold is required";
      if (Number(form.refillAt) >= Number(form.currentSupply)) {
        newErrors.refillAt = "Refill alert must be less than current supply";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        Alert.alert("Error", "Please fill in all required fields correctly");
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

      const colors = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const medicationData = {
        id: isEditing ? (id as string) : Math.random().toString(36).substr(2, 9),
        ...form,
        currentSupply: form.currentSupply ? Number(form.currentSupply) : 0,
        totalSupply: form.currentSupply ? Number(form.currentSupply) : 0,
        refillAt: form.refillAt ? Number(form.refillAt) : 0,
        startDate: form.startDate.toISOString(),
        color: randomColor,
      };

      if (isEditing) {
        await updateMedication(medicationData);
        await updateMedicationReminders(medicationData);
      } else {
        await addMedication(medicationData);
        if (medicationData.reminderEnabled) {
          await scheduleMedicationReminder(medicationData);
        }
        if (medicationData.refillReminder) {
          await scheduleRefillReminder(medicationData);
        }
      }

      Alert.alert("Success", `Medication ${isEditing ? "updated" : "added"} successfully`, [
        { text: "OK", onPress: () => router.back() },
      ], { cancelable: false });
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save medication.", [{ text: "OK" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MANEJADORES DE FECHA Y HORA ---

const onDateChange = (event: any, newValue?: Date) => {
  setShowDatePicker(false);
  if (newValue) {
    setForm((prev) => ({ ...prev, startDate: newValue }));
  }
};

const onTimeChange = (event: any, newValue?: Date) => {
  setShowTimePicker(false);
  if (newValue) {
    const newTime = newValue.toLocaleTimeString("default", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    setForm((prev) => ({
      ...prev,
      times: prev.times.map((t, i) => (i === activeTimeIndex ? newTime : t)),
    }));
  }
};

  // Funciones dinámicas para añadir o quitar horas manualmente
  const addTimeField = () => {
    setForm((prev) => ({
      ...prev,
      times: [...prev.times, "12:00"], // Añade una hora estándar por defecto
    }));
  };

  const removeTimeField = (indexToRemove: number) => {
    if (form.times.length === 1) {
      Alert.alert("Info", "You must have at least one reminder time.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== indexToRemove),
    }));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <LinearGradient
        colors={["#1a8e2d", "#146922"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? "Edit Medication" : "New Medication"}</Text>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContentContainer}
        >
          {/* Nombre y Dosis */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.name && styles.inputError]}
                placeholder="Medication Name"
                placeholderTextColor="#999"
                value={form.name}
                onChangeText={(text) => {
                  setForm({ ...form, name: text });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.dosage && styles.inputError]}
                placeholder="Dosage (e.g., 500mg)"
                placeholderTextColor="#999"
                value={form.dosage}
                onChangeText={(text) => {
                  setForm({ ...form, dosage: text });
                  if (errors.dosage) setErrors({ ...errors, dosage: "" });
                }}
              />
              {errors.dosage && <Text style={styles.errorText}>{errors.dosage}</Text>}
            </View>
          </View>

          {/* Duración ("For how long?") */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>For how long?</Text>
            {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
            <View style={styles.optionsGrid}>
              {DURATIONS.map((dur) => (
                <TouchableOpacity
                  key={dur.id}
                  style={[styles.optionCard, selectedDuration === dur.label && styles.selectedOptionCard]}
                  onPress={() => {
                    setSelectedDuration(dur.label);
                    setForm({ ...form, duration: dur.label });
                    if (errors.duration) setErrors({ ...errors, duration: "" });
                  }}
                >
                  <Text style={[styles.durationNumber, selectedDuration === dur.label && styles.selectedDurationNumber]}>
                    {dur.value > 0 ? dur.value : "∞"}
                  </Text>
                  <Text style={[styles.optionLabel, selectedDuration === dur.label && styles.selectedOptionLabel]}>
                    {dur.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  selectedDuration === "Custom" && styles.selectedOptionCard,
                ]}
                onPress={() => {
                  setSelectedDuration("Custom");
                  if (DURATIONS.some(d => d.label === form.duration)) {
                    setForm({ ...form, duration: "" });
                  }
                }}
              >
                <Ionicons 
                  name="create-outline" 
                  size={24} 
                  color={selectedDuration === "Custom" ? "white" : "#1a8e2d"} 
                  style={{ marginBottom: 5 }}
                />
                <Text style={[styles.optionLabel, selectedDuration === "Custom" && styles.selectedOptionLabel]}>
                  Custom Days
                </Text>
              </TouchableOpacity>
            </View>

            {selectedDuration === "Custom" && (
              <View style={[styles.inputContainer, { marginTop: 10 }]}>
                <TextInput
                  style={styles.mainInput}
                  placeholder="Enter number of days"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={form.duration.replace(" days", "")}
                  onChangeText={(text) => {
                    setForm({ ...form, duration: text ? `${text} days` : "" });
                    if (errors.duration) setErrors({ ...errors, duration: "" });
                  }}
                  autoFocus
                />
              </View>
            )}

            {/* Selector de Fecha de Inicio */}
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar" size={20} color="#1a8e2d" />
              </View>
              <Text style={styles.dateButtonText}>
                Starts {form.startDate.toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form.startDate}
                mode="date"
                onValueChange={onDateChange}
                onDismiss={() => setShowDatePicker(false)}
              />
            )}

            {/* Listado de Horas (Aparece por defecto sin depender de frecuencias) */}
            <View style={styles.timesContainer}>
              <View style={styles.timesHeaderRow}>
                <Text style={styles.timesTitle}>Medication Times</Text>
              </View>
              
              {errors.times && <Text style={styles.errorText}>{errors.times}</Text>}

              {form.times.map((time, index) => (
                <View key={index} style={styles.timeRowContainer}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setActiveTimeIndex(index);
                      setShowTimePicker(true);
                    }}
                  >
                    <View style={styles.timeIconContainer}>
                      <Ionicons name="time-outline" size={20} color="#1a8e2d" />
                    </View>
                    <Text style={styles.timeButtonText}>{time}</Text>
                    <Ionicons name="pencil-outline" size={18} color="#666" />
                  </TouchableOpacity>

                  {form.times.length > 1 && (
                    <TouchableOpacity 
                      style={styles.deleteTimeButton} 
                      onPress={() => removeTimeField(index)}
                    >
                      <Ionicons name="trash-outline" size={22} color="#FF5252" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const [hours, minutes] = form.times[activeTimeIndex].split(":").map(Number);
                  const d = new Date();
                  d.setHours(hours, minutes, 0, 0);
                  return d;
                })()}
                mode="time"
                is24Hour={false}
                onValueChange={onTimeChange}
                onDismiss={() => setShowTimePicker(false)}
              />
            )}
          </View>

          {/* Recordatorios Switch */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={20} color="#1a8e2d" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Reminders</Text>
                    <Text style={styles.switchSubLabel}>Get notified when it's time</Text>
                  </View>
                </View>
                <Switch
                  value={form.reminderEnabled}
                  onValueChange={(value) => setForm({ ...form, reminderEnabled: value })}
                  trackColor={{ false: "#ddd", true: "#1a8e2d" }}
                  thumbColor="white"
                />
              </View>
            </View>
          </View>

          {/* Inventario / Refill Tracking */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="reload" size={20} color="#1a8e2d" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Refill Tracking</Text>
                    <Text style={styles.switchSubLabel}>Get notified when running low</Text>
                  </View>
                </View>
                <Switch
                  value={form.refillReminder}
                  onValueChange={(value) => {
                    setForm({ ...form, refillReminder: value });
                    if (!value) setErrors({ ...errors, currentSupply: "", refillAt: "" });
                  }}
                  trackColor={{ false: "#ddd", true: "#1a8e2d" }}
                  thumbColor="white"
                />
              </View>

              {form.refillReminder && (
                <View style={styles.refillInputs}>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[styles.input, errors.currentSupply && styles.inputError]}
                        placeholder="Current Supply"
                        placeholderTextColor="#999"
                        value={form.currentSupply}
                        onChangeText={(text) => {
                          setForm({ ...form, currentSupply: text });
                          if (errors.currentSupply) setErrors({ ...errors, currentSupply: "" });
                        }}
                        keyboardType="numeric"
                      />
                      {errors.currentSupply && <Text style={styles.errorText}>{errors.currentSupply}</Text>}
                    </View>
                    
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[styles.input, errors.refillAt && styles.inputError]}
                        placeholder="Alert at"
                        placeholderTextColor="#999"
                        value={form.refillAt}
                        onChangeText={(text) => {
                          setForm({ ...form, refillAt: text });
                          if (errors.refillAt) setErrors({ ...errors, refillAt: "" });
                        }}
                        keyboardType="numeric"
                      />
                      {errors.refillAt && <Text style={styles.errorText}>{errors.refillAt}</Text>}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Notas */}
          <View style={styles.section}>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Add notes or special instructions..."
                placeholderTextColor="#999"
                value={form.notes}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={["#1a8e2d", "#146922"]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Medication" : "Add Medication"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isSubmitting}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- NUEVOS ESTILOS AGREGADOS PARA LA SECCIÓN DE REMINDER DINÁMICO ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0, height: Platform.OS === "ios" ? 140 : 120 },
  content: { flex: 1, paddingTop: Platform.OS === "ios" ? 50 : 30 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, zIndex: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "white", justifyContent: "center", alignItems: "center", elevation: 3 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "white", marginLeft: 15 },
  formContainer: { flex: 1 },
  formContentContainer: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 15, marginTop: 10 },
  mainInput: { fontSize: 20, color: "#333", padding: 15 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  optionCard: { width: (width - 60) / 2, backgroundColor: "white", borderRadius: 16, padding: 15, margin: 5, alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0" },
  selectedOptionCard: { backgroundColor: "#1a8e2d", borderColor: "#1a8e2d" },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#333", textAlign: "center" },
  selectedOptionLabel: { color: "white" },
  durationNumber: { fontSize: 24, fontWeight: "700", color: "#1a8e2d", marginBottom: 5 },
  selectedDurationNumber: { color: "white" },
  inputContainer: { backgroundColor: "white", borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e0e0e0" },
  dateButton: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 15, marginTop: 15, borderWidth: 1, borderColor: "#e0e0e0" },
  dateIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginRight: 10 },
  dateButtonText: { flex: 1, fontSize: 16, color: "#333" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#e0e0e0" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabelContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginRight: 15 },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  switchSubLabel: { fontSize: 13, color: "#666", marginTop: 2 },
  inputRow: { flexDirection: "row", marginTop: 15, gap: 10 },
  flex1: { flex: 1 },
  input: { padding: 15, fontSize: 16, color: "#333" },
  textAreaContainer: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  textArea: { height: 100, padding: 15, fontSize: 16, color: "#333" },
  footer: { padding: 20, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  saveButton: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  saveButtonGradient: { paddingVertical: 15, justifyContent: "center", alignItems: "center" },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  cancelButton: { paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: "#e0e0e0", justifyContent: "center", alignItems: "center", backgroundColor: "white" },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "600" },
  inputError: { borderColor: "#FF5252" },
  errorText: { color: "#FF5252", fontSize: 12, marginTop: 4, marginLeft: 12 },
  saveButtonDisabled: { opacity: 0.7 },
  refillInputs: { marginTop: 15 },
  
  // Estilos añadidos para las horas dinámicas:
  timesContainer: { marginTop: 25 },
  timesHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timesTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  addTimeButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  addTimeButtonText: { fontSize: 14, fontWeight: "600", color: "#1a8e2d" },
  timeRowContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  timeButton: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: "#e0e0e0" },
  timeIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginRight: 10 },
  timeButtonText: { flex: 1, fontSize: 16, color: "#333" },
  deleteTimeButton: { width: 45, height: 45, justifyContent: "center", alignItems: "center" }
});