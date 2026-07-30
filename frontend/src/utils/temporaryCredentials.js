export function generateTemporaryPassword() {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const all = uppercase + lowercase + numbers;
  const random = new Uint32Array(10);
  crypto.getRandomValues(random);

  const required = [
    uppercase[random[0] % uppercase.length],
    lowercase[random[1] % lowercase.length],
    numbers[random[2] % numbers.length],
  ];
  const remaining = Array.from(
    { length: 7 },
    (_, index) => all[random[index + 3] % all.length]
  );

  return [...required, ...remaining]
    .sort(() => crypto.getRandomValues(new Uint32Array(1))[0] % 3 - 1)
    .join("");
}

export function buildLoginDetails(email, password) {
  return [
    "Your FIC BackRooms account is ready.",
    `Login email: ${email}`,
    `Temporary password: ${password}`,
    `Login: ${window.location.origin}/login`,
  ].join("\n");
}
