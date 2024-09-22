import { getBaseUrl } from "@utils/envUtils";

export const BASE_URL = getBaseUrl();
export const CATEGORY_URL = `${BASE_URL}api/categories`;
export const MESSAGES_URL = `${BASE_URL}api/messages`;
export const USERS_URL = `${BASE_URL}api/users`;
export const AUTH_URL = `${BASE_URL}api/auth`;
export const LATEST_MESSAGES_URL = `${MESSAGES_URL}/latest`;
export const MESSAGES_BY_CATEGORY_URL = `${MESSAGES_URL}/category`;
export const LOGIN_URL = `${AUTH_URL}/login`;
export const REGISTER_URL = `${AUTH_URL}/register`;
