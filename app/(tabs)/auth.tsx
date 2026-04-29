import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function AuthScreen() {

  const [hasBiometrics, setHasBIometrics] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
      checkBiometrics();
  },[])

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBIometrics(hasHardware && isEnrolled)
}

const authenticate = async () => {
  try {
    // setInAuthenticating(true);
    setError(null);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync;

    //manejo de errores
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: hasHardware && isEnrolled ? "Usa tu face ID/Ingresa tu ID": "Ingresa tu PIN para acceder",
      fallbackLabel: "Usa el PIN",
      cancelLabel: "Cancelar",
      disableDeviceFallback: false,
    });

    if(auth.success){
      router.replace("/")
    }else{
      setError("Autenticacion Falida: Porfavor intente nuevamente")
    }
  }catch (error) {

  }
}
  return (
    <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="medical" size={80} color="white"></Ionicons>
        </View>
        <Text style={styles.title}>MediAlerta</Text>
        <Text style={styles.subtitle}>Recordatorio de citas</Text>

        <View style={styles.card}> 
          <Text style={styles.welcomeText}>Bienvenido!</Text>
          <Text style={styles.instructionText}>
              {hasBiometrics ? "Uso de face ID/TouchIdD o PIN de acceso":"Ingresa tu PIN para acceder"}
          </Text>

            <TouchableOpacity style={[styles.button, isAuthenticating  && styles.buttonDisabled]}
              onPress={authenticate}
              disabled={isAuthenticating}
            >
              <Ionicons
                name={hasBiometrics ? "finger-print-outline": "keypad-outline"}size={24} color="white" style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>
                {isAuthenticating ? "Verificando..." : hasBiometrics ? "Authenticate" : "Ingresa tu PIN" }
              </Text>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorContainer}> 
                  <Ionicons name="alert-circle" size={20} color={"#f44336"} />
                  <Text style={styles.errorText}>{error}</Text>  
              </View>
            )}
        </View>
      </View>
    </LinearGradient>
  );
}

//Estilos generales del SplashScreen 
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex:1,
    padding:20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width:120,
    height:120,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius:60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom:20,
  },
  title: {
    fontSize:24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: {width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color:"rgba(255,255,255, 0.8)",
    marginBottom: 40,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    width: width -40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
        width:0,
        height:2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  errorText: {
    color: "#f44336",
    fontSize: 14,
    marginLeft: 8,
  }
})