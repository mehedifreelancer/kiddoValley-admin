import api from "../../apiConfig";

export interface LoginPayload {
    usernameOrEmail: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
            avatar?: string;
        };
    };
    message?: string;
}

export interface RefreshTokenPayload {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
    };
}

// Named exports for direct import
export const login = (payload: LoginPayload) => {
    return api.post<LoginResponse>("/admin/auth/login", payload);
};

export const logout = (refreshToken: string) => {
    return api.post("/admin/auth/logout", { refreshToken });
};

export const refreshToken = (payload: RefreshTokenPayload) => {
    return api.post<RefreshTokenResponse>("/admin/auth/refresh-token", payload);
};