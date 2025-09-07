import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, File, CalendarEvent } from '../../interfaces';
import { useAuth } from '../../context/AuthContext';
import { filesService } from '../../services/files';
import { calendarService } from '../../services/calendar';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';

type DashboardNavigationProp = StackNavigationProp<AppStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentFiles, setRecentFiles] = useState<File[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    activeFiles: 0,
    upcomingEvents: 0,
  });

  const loadDashboardData = async () => {
    try {
      // Cargar archivos recientes
      const filesResponse = await filesService.getFiles({ limit: 5 });
      setRecentFiles(filesResponse.files);
      setStats(prev => ({
        ...prev,
        totalFiles: filesResponse.total,
        activeFiles: filesResponse.files.filter(f => f.status === 'active').length,
      }));

      // Cargar eventos próximos
      const eventsResponse = await calendarService.getUpcomingEvents(5);
      setUpcomingEvents(eventsResponse.events);
      setStats(prev => ({
        ...prev,
        upcomingEvents: eventsResponse.events.length,
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>¡Hola!</Text>
          <Text style={styles.userName}>{user?.name || 'Estudiante'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

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
            onPress={() => navigation.navigate('Files')}
          >
            <Text style={styles.actionTitle}>📁 Mis Archivos</Text>
            <Text style={styles.actionDescription}>
              Ver y gestionar tus archivos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={styles.actionTitle}>📅 Calendario</Text>
            <Text style={styles.actionDescription}>
              Ver eventos y fechas importantes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionTitle}>👤 Mi Perfil</Text>
            <Text style={styles.actionDescription}>
              Configurar tu cuenta
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Files */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Archivos Recientes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Files')}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {recentFiles.length > 0 ? (
          recentFiles.map((file) => (
            <TouchableOpacity
              key={file.id}
              style={styles.fileItem}
              onPress={() => navigation.navigate('FileDetail', { fileId: file.id })}
            >
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileDate}>
                  {new Date(file.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.fileStatus,
                { backgroundColor: file.status === 'active' ? theme.colors.success : theme.colors.textTertiary }
              ]} />
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
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.seeAllText}>Ver calendario</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.startDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.eventType,
                { backgroundColor: theme.colors.eventPrimary }
              ]} />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay eventos próximos</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
    backgroundColor: theme.colors.background,
  },
  welcomeText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
  },
  userName: {
    ...theme.typography.styles.h3,
    color: theme.colors.text,
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
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.screenPadding,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    ...theme.components.card,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statNumber: {
    ...theme.typography.styles.h2,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...theme.typography.styles.caption,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
  },
  seeAllText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
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
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.components.card,
    marginBottom: theme.spacing.sm,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...theme.typography.styles.body,
    fontWeight: '500',
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
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.components.card,
    marginBottom: theme.spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    ...theme.typography.styles.body,
    fontWeight: '500',
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
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DashboardScreen;