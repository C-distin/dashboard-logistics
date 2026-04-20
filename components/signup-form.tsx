"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconEye,
  IconEyeOff,
  IconMail,
  IconPassword,
  IconSignature,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { type SignUpData, signUpSchema } from "@/lib/validation/auth";
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

export function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignUpData) {
    const { confirmPassword: _, ...signUpInput } = data;

    const promise = authClient.signUp.email(signUpInput).then((res) => {
      if (res.error) {
        throw new Error(res.error.message || "Failed to create account");
      }
      return res.data;
    });

    toast.promise(promise, {
      loading: "Creating account...",
      success: () => {
        router.push("/dashboard");
        router.refresh();
        return "Account created successfully";
      },
      error: (err) => {
        return err.message || "Something went wrong";
      },
    });
  }

  return (
    // Centering Container
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
            <FieldGroup>
              {/* Name Field */}
              <Field>
                <FieldLabel>Full Name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IconUser className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="John Doe"
                    {...register("name")}
                    disabled={isSubmitting}
                  />
                </InputGroup>
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              {/* Username Field */}
              <Field>
                <FieldLabel>Username</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IconSignature className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="johndoe"
                    {...register("username")}
                    disabled={isSubmitting}
                  />
                </InputGroup>
                {errors.username && (
                  <FieldError>{errors.username.message}</FieldError>
                )}
              </Field>

              {/* Email Field */}
              <Field>
                <FieldLabel>Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IconMail className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="email"
                    placeholder="john@example.com"
                    {...register("email")}
                    disabled={isSubmitting}
                  />
                </InputGroup>
                {errors.email && (
                  <FieldError>{errors.email.message}</FieldError>
                )}
              </Field>

              {/* Password Field with Toggle */}
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

              {/* Confirm Password Field with Toggle */}
              <Field>
                <FieldLabel>Confirm Password</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IconPassword className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    {...register("confirmPassword")}
                    disabled={isSubmitting}
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <IconEyeOff className="h-4 w-4" />
                      ) : (
                        <IconEye className="h-4 w-4" />
                      )}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {errors.confirmPassword && (
                  <FieldError>{errors.confirmPassword.message}</FieldError>
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
                      <Spinner className="mr-2 h-4 w-4" /> Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>

        {/* Footer with Sign In Link */}
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/"
            className="ml-1 text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
