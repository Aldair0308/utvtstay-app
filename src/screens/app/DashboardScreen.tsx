import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  ImageSourcePropType,
  Pressable,
  BackHandler,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AppStackParamList, File, CalendarEvent } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";
import { filesService } from "../../services/files";
import { calendarService } from "../../services/calendar";
import { dashboardService } from "../../services/dashboard";
import { theme } from "../../theme";
import LoadingScreen from "../../components/common/LoadingScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomAlert from "../../components/common/CustomAlert";
import { useProfileAlerts } from "../../components/common/ProfileAlerts";
import useAlert from "../../hooks/useAlert";

const BULK_CREATION_KEY = "has_used_bulk_creation";

type DashboardNavigationProp = StackNavigationProp<
  AppStackParamList,
  "Dashboard"
>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user, logout } = useAuth();
  const { alertState, hideAlert, handleLogout } = useProfileAlerts(logout);
  const { alertState: bulkAlertState, hideAlert: hideBulkAlert, showAlert: showBulkAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentFiles, setRecentFiles] = useState<File[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    activeFiles: 0,
    upcomingEvents: 0,
  });
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasUsedBulkCreation, setHasUsedBulkCreation] = useState<boolean>(true);
  const [creatingTemplates, setCreatingTemplates] = useState(false);

  // Cargar el estado de bulk creation desde AsyncStorage al iniciar
  useEffect(() => {
    const loadBulkCreationStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem(BULK_CREATION_KEY);
        if (stored !== null) {
          const hasUsed = stored === 'true';
          setHasUsedBulkCreation(hasUsed);
          console.log('[Dashboard] Bulk creation status from storage:', hasUsed);
        }
      } catch (error) {
        console.error('[Dashboard] Error loading bulk creation status:', error);
      }
    };

    loadBulkCreationStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargar estadísticas del dashboard incluyendo user_info
      const dashboardData = await dashboardService.getDashboardStats();
      
      // Verificar si el usuario ha usado bulk creation desde el servidor
      const hasUsedFromServer = dashboardData.user_info?.has_used_bulk_creation ?? true;
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(BULK_CREATION_KEY, String(hasUsedFromServer));
      setHasUsedBulkCreation(hasUsedFromServer);
      console.log('[Dashboard] Bulk creation status from server:', hasUsedFromServer);

      // Solo cargar datos si el usuario ya usó bulk creation
      if (hasUsedFromServer) {
        // Cargar archivos recientes
        const filesResponse = await filesService.getFiles(1, 5);
        setRecentFiles(filesResponse.files);
        setStats((prev) => ({
          ...prev,
          totalFiles: filesResponse.total,
          activeFiles: filesResponse.files.filter((f) => f.status === "active")
            .length,
        }));

        // Cargar eventos próximos
        const upcomingEvents = await calendarService.getUpcomingEvents(5);
        setUpcomingEvents(upcomingEvents);
        setStats((prev) => ({
          ...prev,
          upcomingEvents: upcomingEvents.length,
        }));
      } else {
        // Mostrar alerta si no ha usado bulk creation
        showBulkCreationAlert();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showBulkCreationAlert = () => {
    showBulkAlert({
      type: 'success',
      title: 'Acción Requerida',
      message: 'Para comenzar a usar la aplicación, necesitas crear tus plantillas de archivos. Esta es una acción obligatoria para nuevos usuarios.',
      primaryButton: {
        text: 'Crear Plantillas',
        onPress: handleCreateTemplates,
      },
      secondaryButton: {
        text: 'Cerrar Aplicación',
        onPress: handleExitApp,
      },
    });
  };

  const handleCreateTemplates = async () => {
    hideBulkAlert();
    setCreatingTemplates(true);
    
    try {
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      await filesService.bulkCreateTemplates({
        user_id: user.id,
        title_prefix: user.name,
        bulk_description: user.name,
      });

      // Actualizar estado local y AsyncStorage
      setHasUsedBulkCreation(true);
      await AsyncStorage.setItem(BULK_CREATION_KEY, 'true');
      console.log('[Dashboard] Bulk creation completed, status saved');

      Alert.alert(
        '¡Éxito!',
        'Tus plantillas han sido creadas correctamente. Ya puedes comenzar a usar la aplicación.',
        [{ text: 'OK', onPress: () => loadDashboardData() }]
      );
    } catch (error: any) {
      console.error('Error creating templates:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudieron crear las plantillas. Por favor, intenta de nuevo.',
        [
          {
            text: 'Reintentar',
            onPress: handleCreateTemplates,
          },
          {
            text: 'Cerrar Aplicación',
            onPress: handleExitApp,
            style: 'destructive',
          },
        ]
      );
    } finally {
      setCreatingTemplates(false);
    }
  };

  const handleExitApp = () => {
    hideBulkAlert();
    BackHandler.exitApp();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getEventColor = (event: CalendarEvent): string => {
    // Si el evento tiene color personalizado, usarlo
    if (event.color) {
      return event.color;
    }

    // Colores por defecto según el tipo
    switch (event.type) {
      case "deadline":
        return "#EF4444"; // Rojo para fechas límite
      case "meeting":
        return "#3B82F6"; // Azul para reuniones
      case "reminder":
        return "#F59E0B"; // Amarillo para recordatorios
      case "personal":
        return "#10B981"; // Verde para eventos personales
      default:
        return theme.colors.primary;
    }
  };

  interface FileIconInfo {
    name?: string;
    color?: string;
    imageSource?: ImageSourcePropType;
  }

  const getFileIconInfo = (file: File): FileIconInfo => {
    const name = (file.name || "").toLowerCase();
    const mime = (file.mimeType || "").toLowerCase();

    if (
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      mime.includes("msword") ||
      mime.includes("wordprocessingml")
    ) {
      return { imageSource: require("../../../assets/img/Word.png") };
    }

    if (
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      mime.includes("excel") ||
      mime.includes("spreadsheetml")
    ) {
      return { imageSource: require("../../../assets/img/Excel.png") };
    }

    if (
      name.endsWith(".html") ||
      name.endsWith(".htm") ||
      mime.includes("html")
    ) {
      return { imageSource: require("../../../assets/img/html.png") };
    }

    if (mime.includes("pdf")) return { name: "file-pdf-box", color: "#D32F2F" };
    if (mime.includes("image"))
      return { name: "file-image-outline", color: theme.colors.textSecondary };
    if (mime.includes("video"))
      return { name: "file-video-outline", color: theme.colors.textSecondary };
    if (mime.includes("audio"))
      return { name: "file-music-outline", color: theme.colors.textSecondary };
    if (mime.includes("text"))
      return {
        name: "file-document-outline",
        color: theme.colors.textSecondary,
      };
    return { name: "file-outline", color: theme.colors.textSecondary };
  };

  const FileTypeIcon: React.FC<{
    imageSource?: ImageSourcePropType;
    iconName?: string;
    color?: string;
  }> = ({ imageSource, iconName, color }) => {
    if (!imageSource) {
      return (
        <MaterialCommunityIcons
          name={(iconName as any) || ("file-outline" as any)}
          size={24}
          color={color || theme.colors.textSecondary}
        />
      );
    }
    return (
      <Image
        source={imageSource}
        style={styles.fileIconImage}
        resizeMode={"contain"}
      />
    );
  };

  const formatEventDate = (event: CalendarEvent): string => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    // Verificar si es el mismo día
    const isSameDay = startDate.toDateString() === endDate.toDateString();

    if (isSameDay) {
      // Formato completo para eventos de un solo día
      const dayNames = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];

      const dayName = dayNames[startDate.getDay()];
      const day = startDate.getDate();
      const monthName = monthNames[startDate.getMonth()];
      const year = startDate.getFullYear();

      return `${dayName} ${day} de ${monthName} ${year}`;
    } else {
      // Formato de rango para eventos de múltiples días
      const shortMonthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];

      const startDay = startDate.getDate();
      const startMonth = shortMonthNames[startDate.getMonth()];
      const startYear = startDate.getFullYear();

      const endDay = endDate.getDate();
      const endMonth = shortMonthNames[endDate.getMonth()];
      const endYear = endDate.getFullYear();

      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || "U")[0]?.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>¡Hola!</Text>
              <Text style={styles.userName}>{user?.name || "Estudiante"}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setMenuVisible((v) => !v)}
            style={styles.menuButton}
          >
            <MaterialCommunityIcons
              name={"dots-vertical" as any}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
        {menuVisible && (
          <Pressable
            style={styles.overlay}
            onPress={() => setMenuVisible(false)}
          />
        )}
        {menuVisible && (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Profile");
              }}
            >
              <Text style={styles.menuItemText}>Ver perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <Text style={styles.menuItemText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contenido bloqueado si no ha usado bulk creation */}
        {!hasUsedBulkCreation ? (
          <View style={styles.blockedContent}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={80}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.blockedTitle}>Configuración Requerida</Text>
            <Text style={styles.blockedMessage}>
              Necesitas crear tus plantillas de archivos para acceder al dashboard.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalFiles}</Text>
                <Text style={styles.statLabel}>Archivos Totales</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.activeFiles}</Text>
                <Text style={styles.statLabel}>Archivos Activos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
                <Text style={styles.statLabel}>Eventos Próximos</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate("Files")}
                >
                  <Text style={styles.actionTitle}>📁 Mis Archivos</Text>
                  <Text style={styles.actionDescription}>
                    Ver y gestionar tus archivos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate("Calendar")}
                >
                  <Text style={styles.actionTitle}>📅 Calendario</Text>
                  <Text style={styles.actionDescription}>
                    Ver eventos y fechas importantes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Files */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Archivos Recientes</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Files")}>
                  <Text style={styles.seeAllText}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              {recentFiles.length > 0 ? (
                recentFiles.map((file) => (
                  <TouchableOpacity
                    key={file.id}
                    style={styles.fileItem}
                    onPress={() =>
                      navigation.navigate("FileDetail", { fileId: file.id })
                    }
                  >
                    {(() => {
                      const icon = getFileIconInfo(file);
                      return (
                        <View style={styles.fileIcon}>
                          <FileTypeIcon
                            imageSource={icon.imageSource}
                            iconName={icon.name as any}
                            color={icon.color}
                          />
                        </View>
                      );
                    })()}
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileDate}>
                        {new Date(file.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.fileStatus,
                        {
                          backgroundColor:
                            file.status === "active"
                              ? theme.colors.success
                              : theme.colors.textTertiary,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay archivos recientes</Text>
              )}
            </View>

            {/* Upcoming Events */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Próximos Eventos</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Calendar")}>
                  <Text style={styles.seeAllText}>Ver calendario</Text>
                </TouchableOpacity>
              </View>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>{formatEventDate(event)}</Text>
                    </View>
                    <View
                      style={[
                        styles.eventType,
                        { backgroundColor: event.color || getEventColor(event) },
                      ]}
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay eventos próximos</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
        primaryButton={alertState.primaryButton}
        secondaryButton={alertState.secondaryButton}
      />
      <CustomAlert
        visible={bulkAlertState.visible}
        title={bulkAlertState.title}
        message={bulkAlertState.message}
        type={bulkAlertState.type}
        onClose={hideBulkAlert}
        primaryButton={bulkAlertState.primaryButton}
        secondaryButton={bulkAlertState.secondaryButton}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.screenPadding,
    backgroundColor: theme.colors.background,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.whiteBackground,
    borderWidth: theme.dimensions.borderWidth.thin,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    ...theme.typography.styles.bodySmall,
    fontWeight: "700",
    color: theme.colors.text,
  },
  menuButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  menuContainer: {
    position: "absolute",
    right: theme.spacing.screenPadding,
    top: 64,
    backgroundColor: theme.colors.background,
    borderRadius: theme.dimensions.borderRadius.md,
    ...theme.components.card,
    paddingVertical: theme.spacing.xs,
    zIndex: 10,
    elevation: 8,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
    elevation: 6,
    backgroundColor: "transparent",
  },
  menuItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  menuItemText: {
    ...theme.typography.styles.bodySmall,
  },
  welcomeText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    display: "none",
  },
  userName: {
    ...theme.typography.styles.h3,
    color: theme.colors.success,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.dimensions.borderRadius.md,
  },
  logoutText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textLight,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: theme.spacing.screenPadding,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    ...theme.components.card,
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  statNumber: {
    ...theme.typography.styles.h2,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  statLabel: {
    ...theme.typography.styles.caption,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.screenPadding,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
  },
  seeAllText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: theme.spacing.md,
  },
  actionCard: {
    ...theme.components.card,
    paddingVertical: theme.spacing.lg,
  },
  actionTitle: {
    ...theme.typography.styles.body,
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    ...theme.components.card,
    marginBottom: theme.spacing.sm,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.dimensions.borderRadius.md,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
    overflow: "hidden",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...theme.typography.styles.body,
    fontWeight: "500",
  },
  fileDate: {
    ...theme.typography.styles.caption,
    marginTop: theme.spacing.xs,
  },
  fileStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fileIconImage: {
    width: "100%",
    height: "100%",
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    ...theme.components.card,
    marginBottom: theme.spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    ...theme.typography.styles.body,
    fontWeight: "500",
  },
  eventDate: {
    ...theme.typography.styles.caption,
    marginTop: theme.spacing.xs,
  },
  eventType: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  blockedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl * 2,
  },
  blockedTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  blockedMessage: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default DashboardScreen;
