import AsyncStorage from "@react-native-async-storage/async-storage"

const MEDICATIONS_KEY = "@medications";
const DOSE_HISTORY_KEY = "@dose_history";
const USER_PROFILE_KEY = "@user_profile";
const CAREGIVER_PROFILE_KEY = "@caregiver_profile";
const DOCTOR_PROFILE_KEY = "@doctor_profile";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  startDate: string;
  duration: string;
  color: string;
  reminderEnabled: boolean;
  currentSupply: number;
  totalSupply: number;
  refillAt: number;
  refillReminder: boolean;
  lastRefillDate?: string;
  notes:string;
}

export interface DoseHistory {
  id: string;
  medicationId: string;
  timestamp: string;
  taken: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  idCard: string;
  birthYear: string;
  birthDays: string;
  medicalHistory: string;
}

export interface CaregiverProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  idCard: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  is24Hours: boolean;
}

export interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  clinic: string;
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener medicamentos:", error);
    return [];
  }
}

export async function addMedication(medication: Medication): Promise<void> {
  try { 
    const medications = await getMedications();
    medications.push(medication);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error("Error al agregar medicamentos:", error);
    throw error;
  }
}

export async function updateMedication(
  updatedMedication: Medication
): Promise<void> {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(
      (med) => med.id === updatedMedication.id
    );
    if (index !== -1) {
      medications[index] = updatedMedication;
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
    }
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const medications = await getMedications();
    const updatedMedications = medications.filter((med) => med.id !== id);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(updatedMedications));

    const history = await getDoseHistory();
    const updatedHistory = history.filter((dose) => dose.medicationId !== id);
    await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function getDoseHistory(): Promise<DoseHistory[]> {
  try {
    const data = await AsyncStorage.getItem(DOSE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    return [];
  }
}

export async function getTodaysDoses(): Promise<DoseHistory[]> {
  try {
    const history = await getDoseHistory();
    const today = new Date().toDateString();
    return history.filter(
      (dose) => new Date(dose.timestamp).toDateString() === today
    );
  } catch (error) {
    console.error("Error getting today's doses:", error);
    return [];
  }
}


export async function recordDose(
  medicationId: string,
  taken: boolean,
  timestamp: string
): Promise<void> {
  try {
    const history = await getDoseHistory();
    const newDose: DoseHistory = {
      id: Math.random().toString(36).substr(2, 9),
      medicationId,
      timestamp,
      taken,
    };

    history.push(newDose);
    await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(history));

    // Actualizar el suministro de medicamentos si se toma
    if (taken) {
      const medications = await getMedications();
      const medication = medications.find((med) => med.id === medicationId);
      if (medication && medication.currentSupply > 0) {
        medication.currentSupply -= 1;
        await updateMedication(medication);
      }
    }
  } catch (error) {
    console.error("Error al registrar la dosis:", error);
    throw error;
  }
}

export async function saveUserProfiles(profiles: UserProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Error saving user profiles:", error);
  }
}

export async function getUserProfiles(): Promise<UserProfile[]> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting user profile:", error);
    return [];
  }
}

export async function saveCaregiverProfiles(profiles: CaregiverProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CAREGIVER_PROFILE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Error saving caregiver profiles:", error);
  }
}

export async function getCaregiverProfiles(): Promise<CaregiverProfile[]> {
  try {
    const data = await AsyncStorage.getItem(CAREGIVER_PROFILE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting caregiver profile:", error);
    return [];
  }
}

export async function saveDoctorProfiles(profiles: DoctorProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DOCTOR_PROFILE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Error saving doctor profiles:", error);
  }
}

export async function getDoctorProfiles(): Promise<DoctorProfile[]> {
  try {
    const data = await AsyncStorage.getItem(DOCTOR_PROFILE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting doctor profile:", error);
    return [];
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      MEDICATIONS_KEY, 
      DOSE_HISTORY_KEY,
      USER_PROFILE_KEY,
      CAREGIVER_PROFILE_KEY,
      DOCTOR_PROFILE_KEY
    ]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}