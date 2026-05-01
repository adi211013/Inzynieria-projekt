"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

type Mode = "login" | "register";

const loginSchema = z.object({
  email: z.email({ message: "Podaj prawidłowy adres e-mail" }),
  password: z
    .string()
    .min(8, { message: "Hasło musi mieć co najmniej 8 znaków" }),
});

const registerSchema = z
  .object({
    username: z
      .string()
      .min(2, { message: "Nazwa użytkownika musi mieć co najmniej 2 znaki" }),
    email: z.email({ message: "Podaj prawidłowy adres e-mail" }),
    password: z
      .string()
      .min(8, { message: "Hasło musi mieć co najmniej 8 znaków" }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Hasła muszą być identyczne",
    path: ["confirm"],
  });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red mt-1">{message}</p>;
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginData) {
    setServerError("");
    try {
      const res = await api.post<{ token: string }>("/auth/login", data);
      localStorage.setItem("token", res.token);
      router.push("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Błąd logowania");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div>
        <label className="text-xs text-text-3 mb-1.5 block">E-mail</label>
        <div
          className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors ${errors.email ? "border-red" : "border-border"}`}
        >
          <Mail className="size-4 text-text-3 shrink-0" />
          <input
            {...register("email")}
            type="email"
            placeholder="j.kowalski@stud.prz.edu.pl"
            className="flex-1 text-sm text-text-1 bg-transparent outline-none placeholder:text-text-3"
          />
        </div>
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <label className="text-xs text-text-3 mb-1.5 block">Hasło</label>
        <div
          className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors ${errors.password ? "border-red" : "border-border"}`}
        >
          <Lock className="size-4 text-text-3 shrink-0" />
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="flex-1 text-sm text-text-1 bg-transparent outline-none placeholder:text-text-3"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-text-3 cursor-pointer hover:text-text-2 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <FieldError message={errors.password?.message} />
      </div>

      <div className="text-right">
        <button
          type="button"
          className="text-xs cursor-pointer text-primary hover:underline"
        >
          Zapomniałeś hasła?
        </button>
      </div>

      {serverError && (
        <p className="text-xs text-red text-center">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 cursor-pointer text-primary-fg text-sm font-semibold py-3 rounded-xl transition-colors mt-1"
      >
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterData) {
    // console.log(data);
    setServerError("");
    try {
      const res = await api.post<{ token: string }>("/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      localStorage.setItem("token", res.token);
      router.push("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Błąd rejestracji");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div>
        <label className="text-xs text-text-3 mb-1.5 block">
          Nazwa użytkownika
        </label>
        <div
          className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors ${errors.username ? "border-red" : "border-border"}`}
        >
          <User className="size-4 text-text-3 shrink-0" />
          <input
            {...register("username")}
            type="text"
            placeholder="jan_kowalski"
            className="flex-1 text-sm text-text-1 bg-transparent outline-none placeholder:text-text-3"
          />
        </div>
        <FieldError message={errors.username?.message} />
      </div>

      <div>
        <label className="text-xs text-text-3 mb-1.5 block">E-mail</label>
        <div
          className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors ${errors.email ? "border-red" : "border-border"}`}
        >
          <Mail className="size-4 text-text-3 shrink-0" />
          <input
            {...register("email")}
            type="email"
            placeholder="j.kowalski@stud.prz.edu.pl"
            className="flex-1 text-sm text-text-1 bg-transparent outline-none placeholder:text-text-3"
          />
        </div>
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <label className="text-xs text-text-3 mb-1.5 block">Hasło</label>
        <div
          className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors ${errors.password ? "border-red" : "border-border"}`}
        >
          <Lock className="size-4 text-text-3 shrink-0" />
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="flex-1 text-sm text-text-1 bg-transparent outline-none placeholder:text-text-3"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-text-3 cursor-pointer hover:text-text-2 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <FieldError message={errors.password?.message} />
      </div>

      <div>
        <label className="text-xs text-text-3 mb-1.5 block">
          Potwierdź hasło
        </label>
        <div
          className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors ${errors.confirm ? "border-red" : "border-border"}`}
        >
          <Lock className="size-4 text-text-3 shrink-0" />
          <input
            {...register("confirm")}
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            className="flex-1 text-sm text-text-1 bg-transparent outline-none placeholder:text-text-3"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="text-text-3 cursor-pointer hover:text-text-2 transition-colors"
          >
            {showConfirm ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <FieldError message={errors.confirm?.message} />
      </div>

      {serverError && (
        <p className="text-xs text-red text-center">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 cursor-pointer text-primary-fg text-sm font-semibold py-3 rounded-xl transition-colors mt-1"
      >
        {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
      </button>
    </form>
  );
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="w-full max-w-md px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="size-6 text-primary" />
          <span className="font-heading font-semibold text-text-1 text-2xl">
            Sanctuary
          </span>
        </div>
        <p className="text-text-3 text-sm">Twój tracker nawyków i celów</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-8">
        <div className="flex rounded-xl bg-surface-alt p-1 mb-6">
          <button
            onClick={() => setMode("login")}
            className={[
              "flex-1 cursor-pointer py-2 text-sm font-semibold rounded-lg transition-colors",
              mode === "login"
                ? "bg-surface text-text-1 shadow-sm"
                : "text-text-2 hover:text-text-1",
            ].join(" ")}
          >
            Zaloguj się
          </button>
          <button
            onClick={() => setMode("register")}
            className={[
              "flex-1 cursor-pointer py-2 text-sm font-semibold rounded-lg transition-colors",
              mode === "register"
                ? "bg-surface text-text-1 shadow-sm"
                : "text-text-2 hover:text-text-1",
            ].join(" ")}
          >
            Zarejestruj się
          </button>
        </div>
        {mode === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}
