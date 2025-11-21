import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, File, CalendarEvent } from '../../interfaces';
import { useAuth } from '../../context/AuthContext';
import { filesService } from '../../services/files';
import { calendarService } from '../../services/calendar';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      const upcomingEvents = await calendarService.getUpcomingEvents(5);
      setUpcomingEvents(upcomingEvents);
      setStats(prev => ({
        ...prev,
        upcomingEvents: upcomingEvents.length,
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
    const name = (file.name || '').toLowerCase();
    const mime = (file.mimeType || '').toLowerCase();

    if (
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      mime.includes('msword') ||
      mime.includes('wordprocessingml')
    ) {
      return { imageSource: require('../../../assets/img/Word.png') };
    }

    if (
      name.endsWith('.xls') ||
      name.endsWith('.xlsx') ||
      mime.includes('excel') ||
      mime.includes('spreadsheetml')
    ) {
      return { imageSource: require('../../../assets/img/Excel.png') };
    }

    if (name.endsWith('.html') || name.endsWith('.htm') || mime.includes('html')) {
      return { imageSource: require('../../../assets/img/html.png') };
    }

    if (mime.includes('pdf')) return { name: 'file-pdf-box', color: '#D32F2F' };
    if (mime.includes('image')) return { name: 'file-image-outline', color: theme.colors.textSecondary };
    if (mime.includes('video')) return { name: 'file-video-outline', color: theme.colors.textSecondary };
    if (mime.includes('audio')) return { name: 'file-music-outline', color: theme.colors.textSecondary };
    if (mime.includes('text')) return { name: 'file-document-outline', color: theme.colors.textSecondary };
    return { name: 'file-outline', color: theme.colors.textSecondary };
  };

  const FileTypeIcon: React.FC<{ imageSource?: ImageSourcePropType; iconName?: string; color?: string }> = ({ imageSource, iconName, color }) => {
    if (!imageSource) {
      return <MaterialCommunityIcons name={(iconName as any) || ('file-outline' as any)} size={24} color={color || theme.colors.textSecondary} />;
    }
    return (
      <Image
        source={imageSource}
        style={styles.fileIconImage}
        resizeMode={'contain'}
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
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      const dayName = dayNames[startDate.getDay()];
      const day = startDate.getDate();
      const monthName = monthNames[startDate.getMonth()];
      const year = startDate.getFullYear();
      
      return `${dayName} ${day} de ${monthName} ${year}`;
    } else {
      // Formato de rango para eventos de múltiples días
      const shortMonthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
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
              {(() => {
                const icon = getFileIconInfo(file);
                return (
                  <View style={styles.fileIcon}>
                    <FileTypeIcon imageSource={icon.imageSource} iconName={icon.name as any} color={icon.color} />
                  </View>
                );
              })()}
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
                  {formatEventDate(event)}
                </Text>
              </View>
              <View style={[
                styles.eventType,
                { backgroundColor: event.color || getEventColor(event) }
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
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.dimensions.borderRadius.md,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    overflow: 'hidden',
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
  fileIconImage: {
    width: '100%',
    height: '100%',
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