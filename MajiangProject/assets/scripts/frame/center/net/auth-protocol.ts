export interface AuthResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user?: {
        id: string;
        username: string;
        displayName: string;
        role: string;
        status: string;
    };
    timestamp: string;
}

function encodeVarint(value: number, output: number[]): void {
    let remaining = value >>> 0;
    while (remaining > 127) {
        output.push((remaining & 127) | 128);
        remaining >>>= 7;
    }
    output.push(remaining);
}

function encodeString(field: number, value: string, output: number[]): void {
    if (!value) {
        return;
    }
    const bytes = new TextEncoder().encode(value);
    encodeVarint((field << 3) | 2, output);
    encodeVarint(bytes.length, output);
    output.push(...bytes);
}

export function encodeAuthRequest(username: string, password: string, displayName?: string): Uint8Array {
    const output: number[] = [];
    encodeString(1, username, output);
    encodeString(2, password, output);
    encodeString(3, displayName ?? '', output);
    return new Uint8Array(output);
}

function readVarint(bytes: Uint8Array, state: { offset: number }): number {
    let value = 0;
    let shift = 0;
    while (state.offset < bytes.length) {
        const current = bytes[state.offset++];
        value += (current & 127) * 2 ** shift;
        if ((current & 128) === 0) {
            return value;
        }
        shift += 7;
    }
    throw new Error('Invalid protobuf varint');
}

function readString(bytes: Uint8Array, state: { offset: number }): string {
    const length = readVarint(bytes, state);
    const end = state.offset + length;
    if (end > bytes.length) {
        throw new Error('Invalid protobuf string');
    }
    const value = new TextDecoder().decode(bytes.subarray(state.offset, end));
    state.offset = end;
    return value;
}

function skipField(bytes: Uint8Array, state: { offset: number }, wireType: number): void {
    if (wireType === 0) {
        readVarint(bytes, state);
    } else if (wireType === 2) {
        state.offset += readVarint(bytes, state);
    } else {
        throw new Error('Unsupported protobuf wire type');
    }
}

function decodeUser(bytes: Uint8Array): AuthResponse['user'] {
    const state = { offset: 0 };
    const user = { id: '', username: '', displayName: '', role: '', status: '' };
    while (state.offset < bytes.length) {
        const tag = readVarint(bytes, state);
        const field = tag >>> 3;
        const wireType = tag & 7;
        if (wireType !== 2) {
            skipField(bytes, state, wireType);
            continue;
        }
        const value = readString(bytes, state);
        if (field === 1) user.id = value;
        else if (field === 2) user.username = value;
        else if (field === 3) user.displayName = value;
        else if (field === 4) user.role = value;
        else if (field === 5) user.status = value;
    }
    return user;
}

export function decodeAuthResponse(data: ArrayBuffer): AuthResponse {
    const bytes = new Uint8Array(data);
    const state = { offset: 0 };
    const response: AuthResponse = { success: false, timestamp: '' };
    while (state.offset < bytes.length) {
        const tag = readVarint(bytes, state);
        const field = tag >>> 3;
        const wireType = tag & 7;
        if (field === 1 && wireType === 0) response.success = readVarint(bytes, state) !== 0;
        else if (field >= 2 && field <= 4 && wireType === 2) {
            const value = readString(bytes, state);
            if (field === 2) response.accessToken = value;
            else if (field === 3) response.refreshToken = value;
            else response.error = value;
        } else if (field === 5 && wireType === 2) {
            const length = readVarint(bytes, state);
            response.user = decodeUser(bytes.subarray(state.offset, state.offset + length));
            state.offset += length;
        } else if (field === 6 && wireType === 2) response.timestamp = readString(bytes, state);
        else skipField(bytes, state, wireType);
    }
    return response;
}