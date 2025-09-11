import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AppStackParamList, CalendarEvent } from "../../interfaces";
import { calendarService } from "../../services/calendar";
import { theme } from "../../theme";
import LoadingScreen from "../../components/common/LoadingScreen";

type CalendarNavigationProp = StackNavigationProp<
  AppStackParamList,
  "Calendar"
>;

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<CalendarNavigationProp>();

  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");

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

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const events = await calendarService.getEvents({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
      setEvents(events);
      generateCalendarDays(events);
    } catch (error) {
      console.error("Error loading calendar data:", error);
      Alert.alert('Error', 'No se pudieron cargar los eventos del calendario. Por favor, intenta nuevamente.');
      // En caso de error, mostrar eventos vacíos en lugar de fallar
      setEvents([]);
      generateCalendarDays([]);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (eventsData: CalendarEvent[]) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const today = new Date();

    // Ajustar al primer día de la semana (domingo)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: CalendarDay[] = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const currentDateIter = new Date(startDate);

    while (currentDateIter <= endDate) {
      const dayEvents = eventsData.filter((event) => {
        const eventStartDate = new Date(event.start_date);
        const eventEndDate = new Date(event.end_date);
        const currentDay = new Date(currentDateIter);
        
        // Normalizar las fechas para comparar solo el día (sin hora)
        eventStartDate.setHours(0, 0, 0, 0);
        eventEndDate.setHours(0, 0, 0, 0);
        currentDay.setHours(0, 0, 0, 0);
        
        // El evento aparece en el día si:
        // - El día actual está entre la fecha de inicio y fin del evento (inclusive)
        return currentDay >= eventStartDate && currentDay <= eventEndDate;
      });

      days.push({
        date: new Date(currentDateIter),
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: currentDateIter.toDateString() === today.toDateString(),
        events: dayEvents,
      });

      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    setCalendarDays(days);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDayPress = (day: CalendarDay) => {
    setSelectedDate(day.date);
    if (day.events.length > 0) {
      // Mostrar eventos del día
      showDayEvents(day);
    } else {
      // Opción para agregar evento
      Alert.alert(
        "Día seleccionado",
        `${day.date.toLocaleDateString("es-ES")}\n\n¿Deseas agregar un evento?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Agregar Evento", onPress: () => openEventModal(day.date) },
        ]
      );
    }
  };

  const showDayEvents = (day: CalendarDay) => {
    const eventsList = day.events.map((event) => `• ${event.title}`).join("\n");
    Alert.alert(
      `Eventos - ${day.date.toLocaleDateString("es-ES")}`,
      eventsList,
      [
        { text: "Cerrar", style: "cancel" },
        { text: "Agregar Evento", onPress: () => openEventModal(day.date) },
      ]
    );
  };

  const openEventModal = (date: Date) => {
    setSelectedDate(date);
    setNewEventTitle("");
    setNewEventDescription("");
    setShowEventModal(true);
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) {
      Alert.alert("Error", "El título del evento es requerido");
      return;
    }

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const newEvent: Omit<CalendarEvent, "id"> = {
        title: newEventTitle.trim(),
        description: newEventDescription.trim(),
        start_date: dateString,
        end_date: dateString,
        start_time: "09:00:00",
        end_time: "10:00:00",
        type: "personal",
        color: theme.colors.primary,
        priority: "medium"
      };

      await calendarService.createEvent(newEvent);
      setShowEventModal(false);
      loadCalendarData(); // Recargar calendario
      Alert.alert("Éxito", "Evento creado correctamente");
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "No se pudo crear el evento");
    }
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
        return theme.colors.secondary;
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "";
    }
  };

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const hasEvents = day.events.length > 0;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayContainer,
          !day.isCurrentMonth && styles.dayContainerInactive,
          day.isToday && styles.dayContainerToday,
        ]}
        onPress={() => handleDayPress(day)}
      >
        <Text
          style={[
            styles.dayNumber,
            !day.isCurrentMonth && styles.dayNumberInactive,
            day.isToday && styles.dayNumberToday,
          ]}
        >
          {day.date.getDate()}
        </Text>

        {hasEvents && (
          <View style={styles.eventsContainer}>
            {day.events.slice(0, 3).map((event, eventIndex) => (
              <View
                key={eventIndex}
                style={[
                  styles.eventDot,
                  { backgroundColor: getEventColor(event) },
                ]}
              />
            ))}
            {day.events.length > 3 && (
              <Text style={styles.moreEvents}>+{day.events.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen message="Cargando calendario..." />;
  }

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth("prev")}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth("next")}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Names Header */}
      <View style={styles.dayNamesContainer}>
        {dayNames.map((dayName, index) => (
          <View key={index} style={styles.dayNameContainer}>
            <Text style={styles.dayName}>{dayName}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        <ScrollView style={styles.calendarScrollView}>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </View>
        </ScrollView>
      </View>

      {/* Upcoming Events */}
      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>Próximos Eventos</Text>
        <ScrollView
          style={styles.upcomingScrollView}
          showsVerticalScrollIndicator={false}
        >
          {events
            .filter((event) => new Date(event.start_date) >= new Date())
            .slice(0, 3)
            .map((event, index) => (
              <View key={index} style={styles.upcomingEvent}>
                <View
                  style={[
                    styles.eventColorIndicator,
                    { backgroundColor: getEventColor(event) },
                  ]}
                />
                <View style={styles.eventInfo}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.priorityIcon}>
                      {getPriorityIcon(event.priority)}
                    </Text>
                  </View>
                  <Text style={styles.eventDate} numberOfLines={1}>
                    {new Date(event.start_date).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })}
                    {event.start_time && ` - ${event.start_time}`}
                  </Text>
                  <Text style={styles.eventType} numberOfLines={1}>
                    {event.type === "deadline"
                      ? "Fecha límite"
                      : event.type === "meeting"
                      ? "Reunión"
                      : event.type === "reminder"
                      ? "Recordatorio"
                      : event.type === "personal"
                      ? "Personal"
                      : event.type}
                  </Text>
                </View>
              </View>
            ))}
          {events.filter((event) => new Date(event.start_date) >= new Date())
            .length === 0 && (
            <Text style={styles.noEventsText}>No hay próximos eventos</Text>
          )}
        </ScrollView>
      </View>

      {/* Add Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <Text style={styles.modalCancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuevo Evento</Text>
            <TouchableOpacity onPress={handleCreateEvent}>
              <Text style={styles.modalSaveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDate}>
              {selectedDate?.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título del Evento</Text>
              <TextInput
                style={styles.input}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="Ingresa el título del evento"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newEventDescription}
                onChangeText={setNewEventDescription}
                placeholder="Descripción del evento"
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  navButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.dimensions.borderRadius.sm,
  },
  navButtonText: {
    ...theme.typography.styles.h2,
    color: theme.colors.primary,
  },
  monthTitle: {
    ...theme.typography.styles.h3,
  },
  dayNamesContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.sm,
  },
  dayNameContainer: {
    flex: 1,
    alignItems: "center",
  },
  dayName: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  calendarContainer: {
    height: 350,
    marginBottom: theme.spacing.md,
  },
  calendarScrollView: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: theme.spacing.xs,
  },
  dayContainer: {
    width: "14.28%",
    aspectRatio: 1,
    padding: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "flex-start",
    borderWidth: theme.dimensions.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  dayContainerInactive: {
    backgroundColor: theme.colors.backgroundTertiary,
  },
  dayContainerToday: {
    backgroundColor: theme.colors.primary + "20",
    borderColor: theme.colors.primary,
  },
  dayNumber: {
    ...theme.typography.styles.body,
    fontWeight: "500",
  },
  dayNumberInactive: {
    color: theme.colors.textTertiary,
  },
  dayNumberToday: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  eventsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: theme.spacing.xs,
    alignItems: "center",
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 2,
    marginBottom: 2,
  },
  moreEvents: {
    ...theme.typography.styles.caption,
    color: theme.colors.textSecondary,
    fontSize: 8,
  },
  upcomingSection: {
    flex: 1,
    padding: theme.spacing.screenPadding,
    backgroundColor: theme.colors.surface,
  },
  upcomingScrollView: {
    maxHeight: 200,
  },
  noEventsText: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.md,
    fontStyle: "italic",
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
    marginBottom: theme.spacing.md,
  },
  upcomingEvent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  eventColorIndicator: {
    width: 4,
    height: "100%",
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  eventTitle: {
    ...theme.typography.styles.body,
    fontWeight: "600",
    flex: 1,
  },
  priorityIcon: {
    fontSize: 16,
    marginLeft: theme.spacing.xs,
  },
  eventDate: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  eventType: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary,
    fontWeight: "500",
    marginBottom: theme.spacing.xs,
  },
  eventTutor: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    marginBottom: theme.spacing.xs,
  },
  eventDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  modalCancelButton: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    ...theme.typography.styles.h4,
  },
  modalSaveButton: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.screenPadding,
  },
  modalDate: {
    ...theme.typography.styles.h4,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.styles.label,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
  },
  textArea: {
    height: 100,
    paddingTop: theme.spacing.inputPadding,
  },
});

export default CalendarScreen;
