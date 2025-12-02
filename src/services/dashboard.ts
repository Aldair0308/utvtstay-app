import apiClient, { handleApiError } from "./api";
import { ApiResponse } from "../interfaces";

export interface DashboardStats {
  files: any;
  calendar: any;
  activity: any;
  progress: any;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  has_used_bulk_creation: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  user_info: UserInfo;
  last_updated: string;
}

export const dashboardService = {
  /**
   * Obtener estadísticas del dashboard
   */
  getDashboardStats: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get<ApiResponse<DashboardData>>(
        "/dashboard/stats"
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Error al obtener estadísticas del dashboard");
    } catch (error) {
      console.error("Error en getDashboardStats:", error);
      throw new Error(handleApiError(error));
    }
  },
};
