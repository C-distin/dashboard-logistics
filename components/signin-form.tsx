"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconEye,
  IconEyeOff,
  IconPassword,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { type SignInData, signInSchema } from "@/lib/validation/auth";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Spinner } from "./ui/spinner";

export function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInData) {
    const { identifier, password } = data;

    // Detect if input is email or username
    // Simple check: if it contains '@', treat as email
    const isEmail = identifier.includes("@");

    // Create the appropriate promise based on input type
    const promise = isEmail
      ? authClient.signIn.email({ email: identifier, password }).then((res) => {
          if (res.error)
            throw new Error(res.error.message || "Invalid credentials");
          return res.data;
        })
      : authClient.signIn
          .username({ username: identifier, password })
          .then((res) => {
            if (res.error)
              throw new Error(res.error.message || "Invalid credentials");
            return res.data;
          });

    toast.promise(promise, {
      loading: "Signing in...",
      success: () => {
        router.push("/dashboard");
        router.refresh();
        return "Welcome back!";
      },
      error: (err) => {
        return err.message || "Something went wrong";
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your email or username to sign in.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
            <FieldGroup>
              {/* Identifier Field (Email or Username) */}
              <Field>
                <FieldLabel>Email or Username</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IconUser className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="john@example.com or johndoe"
                    {...register("identifier")}
                    disabled={isSubmitting}
                  />
                </InputGroup>
                {errors.identifier && (
                  <FieldError>{errors.identifier.message}</FieldError>
                )}
              </Field>

              {/* Password Field */}
              <Field>
                <FieldLabel>Password</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IconPassword className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    {...register("password")}
                    disabled={isSubmitting}
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <IconEyeOff className="h-4 w-4" />
                      ) : (
                        <IconEye className="h-4 w-4" />
                      )}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {errors.password && (
                  <FieldError>{errors.password.message}</FieldError>
                )}
              </Field>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="hover:text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          {/*
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
          */}
        </CardFooter>
      </Card>
    </div>
  );
}
