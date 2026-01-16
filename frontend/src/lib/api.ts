// Re-export axios client for consistency with existing imports
// All new code should import from @/lib/axios directly
import axiosClient, { apiRequest } from './axios';

export { apiRequest };
export default axiosClient;

