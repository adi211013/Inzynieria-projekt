"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useUser, useRefreshUser } from "@/components/UserContext";
import { api } from "@/lib/api";

const TIMEZONES = [
  { value: "Europe/Warsaw", label: "Europe/Warsaw (UTC+1)" },
  { value: "Europe/London", label: "Europe/London (UTC+0)" },
  { value: "Europe/Paris", label: "Europe/Paris (UTC+1)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (UTC+1)" },
  { value: "Europe/Bucharest", label: "Europe/Bucharest (UTC+2)" },
  { value: "Europe/Kiev", label: "Europe/Kiev (UTC+2)" },
  { value: "America/New_York", label: "America/New_York (UTC-5)" },
  { value: "America/Chicago", label: "America/Chicago (UTC-6)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+8)" },
  { value: "UTC", label: "UTC" },
];

const profileSchema = z.object({
  username: z
    .string()
    .min(2, "Nazwa użytkownika musi mieć co najmniej 2 znaki"),
  email: z.email({ message: "Podaj prawidłowy adres e-mail" }),
  timezone: z.string().min(1),
});

type ProfileData = z.infer<typeof profileSchema>;

function getInitials(name: string) {
  const words = name.split(/[\s_]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red mt-1">{message}</p>;
}

export default function UstawieniaPage() {
  const user = useUser();
  const refreshUser = useRefreshUser();
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", email: "", timezone: "Europe/Warsaw" },
  });

  const watched = watch();
  const isDirty =
    !!user &&
    (watched.username !== user.username ||
      watched.email !== user.email ||
      watched.timezone !== (user.timezone ?? "Europe/Warsaw"));

  useEffect(() => {
    if (!user) return;
    reset({
      username: user.username,
      email: user.email,
      timezone: user.timezone ?? "Europe/Warsaw",
    });
  }, [user, reset]);

  async function onSubmit(data: ProfileData) {
    setServerError("");
    setSaved(false);
    try {
      await api.put("/auth/me", {
        username: data.username,
        email: data.email,
        timezone: data.timezone,
      });
      reset(data);
      refreshUser();
      setSaved(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Błąd zapisu danych");
    }
  }

  function handleCancel() {
    if (!user) return;
    reset({
      username: user.username,
      email: user.email,
      timezone: user.timezone ?? "Europe/Warsaw",
    });
    setSaved(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text-1 bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-text-3";
  const labelClass = "block text-sm font-medium text-text-1 mb-1.5";

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-1">Ustawienia</h1>
          <p className="text-sm text-text-3 mt-1">Zarządzaj swoim kontem</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8">
          <h2 className="text-lg font-semibold text-text-1">Profil</h2>
          <p className="text-sm text-text-2 mt-0.5">
            Twoje podstawowe dane i sposób, w jaki Sanctuary się do ciebie
            zwraca.
          </p>

          <div className="flex items-center gap-4 mt-6 mb-6">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg text-lg font-bold">
              {user?.username ? getInitials(user.username) : "?"}
            </div>
            <p className="text-sm font-medium text-text-1">{user?.username}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelClass}>Nazwa użytkownika</label>
              <input
                {...register("username")}
                type="text"
                className={`${inputClass} ${errors.username ? "border-red" : ""}`}
              />
              <FieldError message={errors.username?.message} />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                {...register("email")}
                type="email"
                className={`${inputClass} ${errors.email ? "border-red" : ""}`}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <label className={labelClass}>Strefa czasowa</label>
              <select
                {...register("timezone")}
                className={`${inputClass} cursor-pointer`}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-3 mt-1.5">
                Streaki resetują się o północy w twojej strefie.
              </p>
            </div>

            {serverError && <p className="text-xs text-red">{serverError}</p>}
            {saved && (
              <p className="text-xs text-accent font-medium">
                Zmiany zostały zapisane.
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className={`bg-primary hover:bg-primary/90 disabled:opacity-50 ${isDirty ? "cursor-pointer" : null} text-primary-fg text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors`}
              >
                {isSubmitting
                  ? "Zapisywanie..."
                  : isDirty
                    ? "Zapisz zmiany"
                    : "Brak zmian"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={!isDirty}
                className="text-sm font-semibold text-text-2 hover:text-text-1 disabled:opacity-40 border border-border px-5 py-2.5 rounded-lg transition-colors cursor-pointer hover:bg-surface-alt"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8">
          <h2 className="text-lg font-semibold text-text-1">Konto</h2>
          <p className="text-sm text-text-2 mt-0.5 mb-4">
            Po wylogowaniu wróć do strony logowania.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-red border border-red/40 hover:bg-red/5 px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Wyloguj się
          </button>
        </div>
      </div>
    </div>
  );
}
