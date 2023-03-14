export function LoginToUuid(login) {
    return Buffer.from(login, "base64").toString("hex").replace(/([0-z]{8})([0-z]{4})([0-z]{4})([0-z]{4})([0-z]{12})/,"$1-$2-$3-$4-$5");
}

export function UuidToLogin(uuid) {
    return Buffer.from(uuid.replaceAll("-",""), "hex").toString("base64url");
}