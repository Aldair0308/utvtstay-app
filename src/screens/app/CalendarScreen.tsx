import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, CalendarEvent } from '../../interfaces';
import { calendarService } from '../../services/calendar';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';

type CalendarNavigationProp = StackNavigationProp<AppStackParamList, 'Calendar'>;

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
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      const eventsData = await calendarService.getEvents(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      );
      
      setEvents(eventsData);
      generateCalendarDays(eventsData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'No se pudo cargar el calendario');
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
      const dayEvents = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === currentDateIter.toDateString();
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
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
        'Día seleccionado',
        `${day.date.toLocaleDateString('es-ES')}\n\n¿Deseas agregar un evento?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Agregar Evento', onPress: () => openEventModal(day.date) },
        ]
      );
    }
  };

  const showDayEvents = (day: CalendarDay) => {
    const eventsList = day.events.map(event => `• ${event.title}`).join('\n');
    Alert.alert(
      `Eventos - ${day.date.toLocaleDateString('es-ES')}`,
      eventsList,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Agregar Evento', onPress: () => openEventModal(day.date) },
      ]
    );
  };

  const openEventModal = (date: Date) => {
    setSelectedDate(date);
    setNewEventTitle('');
    setNewEventDescription('');
    setShowEventModal(true);
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) {
      Alert.alert('Error', 'El título del evento es requerido');
      return;
    }

    try {
      const newEvent: Omit<CalendarEvent, 'id'> = {
        title: newEventTitle.trim(),
        description: newEventDescription.trim(),
        date: selectedDate.toISOString(),
        type: 'personal',
        color: theme.colors.primary,
      };

      await calendarService.createEvent(newEvent);
      setShowEventModal(false);
      loadCalendarData(); // Recargar calendario
      Alert.alert('Éxito', 'Evento creado correctamente');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'No se pudo crear el evento');
    }
  };

  const getEventColor = (type: string): string => {
    switch (type) {
      case 'academic':
        return theme.colors.fileStates.shared;
      case 'personal':
        return theme.colors.primary;
      case 'deadline':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
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
        <Text style={[
          styles.dayNumber,
          !day.isCurrentMonth && styles.dayNumberInactive,
          day.isToday && styles.dayNumberToday,
        ]}>
          {day.date.getDate()}
        </Text>
        
        {hasEvents && (
          <View style={styles.eventsContainer}>
            {day.events.slice(0, 3).map((event, eventIndex) => (
              <View
                key={eventIndex}
                style={[
                  styles.eventDot,
                  { backgroundColor: getEventColor(event.type) }
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
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
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
      <ScrollView style={styles.calendarContainer}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => renderCalendarDay(day, index))}
        </View>
        
        {/* Upcoming Events */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          {events.filter(event => new Date(event.date) >= new Date()).slice(0, 5).map((event, index) => (
            <View key={index} style={styles.upcomingEvent}>
              <View style={[
                styles.eventColorIndicator,
                { backgroundColor: getEventColor(event.type) }
              ]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

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
              {selectedDate?.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.sm,
  },
  dayNameContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  calendarContainer: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.xs,
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: theme.dimensions.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  dayContainerInactive: {
    backgroundColor: theme.colors.backgroundTertiary,
  },
  dayContainerToday: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  dayNumber: {
    ...theme.typography.styles.body,
    fontWeight: '500',
  },
  dayNumberInactive: {
    color: theme.colors.textTertiary,
  },
  dayNumberToday: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    alignItems: 'center',
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
    padding: theme.spacing.screenPadding,
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
    marginBottom: theme.spacing.md,
  },
  upcomingEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    ...theme.components.card,
  },
  eventColorIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    ...theme.typography.styles.body,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  eventDate: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.screenPadding,
  },
  modalDate: {
    ...theme.typography.styles.h4,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
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