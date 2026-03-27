/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import SplitText from "@/components/(shared-components)/SplitText";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, LoginFormData } from "@/utils/zod/loginSchemas";
import { LoginInterface } from "@/interfaces/loginInterface";
import toast from "react-hot-toast";
import { handleErrorMessage } from "@/utils/handleErrorMessage";
import { loginWithFormData } from "@/(api-handlers)/loginHandler";
import { getUserData } from "@/(api-handlers)/userHandler";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { setCookie } from "cookies-next";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isUsername, setIsUsername] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email_or_username: "",
            password: "",
            remember_me: false
        }
    });

    const emailOrUsernameValue = watch("email_or_username");

    // Function to check if input looks like an email
    const isEmail = (value: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);

        // Determine if input is email or username
        const isEmailInput = isEmail(data.email_or_username);
        setIsUsername(!isEmailInput);

        // Create FormData object
        const formData = new FormData();

        formData.append('username', data.email_or_username);
        formData.append('password', data.password);

        try {
            const response = await loginWithFormData(formData);
            if (response) {
                setCookie('pos_token', response.access_token, {
                    maxAge: 30 * 24 * 60 * 60, // 30 days
                    path: '/',
                });

                setCookie('user_role', response.user?.role || 'attendant', {
                    maxAge: 30 * 24 * 60 * 60,
                    path: '/',
                });

                const { setAuth, updateUser } = useAuthStore.getState();
                setAuth(response);

                try {
                    const userData = await getUserData();
                    updateUser(userData);
                } catch (userError) {
                    handleErrorMessage(userError, "Failed to fetch user data.");
                }

                toast.success("Login successful!");

                const role = response.user?.role;
                if (role === 'attendant') {
                    router.push("/sales");
                } else if (role === 'manager') {
                    router.push("/orders");
                } else {
                    router.push("/dashboard");
                }
            }
        } catch (error: any) {
            handleErrorMessage(error, "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center justify-center">
                    <div className="relative flex h-16 shrink-0 items-center gap-2">
                        <Wallet className='size-10 text-primary' />
                        <SplitText text="Paynest" className="text-3xl font-bold text-primary" />
                    </div>
                    <h2 className="text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                    <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                        {/* Option 1: Using react-hook-form (recommended) */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label htmlFor="email_or_username" className="block text-sm/6 font-medium text-gray-900">
                                    Email or Username
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email_or_username"
                                        type="text"
                                        disabled={isLoading}
                                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 ${errors.email_or_username ? 'outline-red-300' : 'outline-gray-300'} placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm/6`}
                                        placeholder="Enter your email or username"
                                        {...register("email_or_username")}
                                    />
                                </div>
                                {errors.email_or_username && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email_or_username.message}</p>
                                )}
                                {emailOrUsernameValue && !errors.email_or_username && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        You&apos;re logging in with {isEmail(emailOrUsernameValue) ? 'email' : 'username'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                                    Password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        type="password"
                                        disabled={isLoading}
                                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 ${errors.password ? 'outline-red-300' : 'outline-gray-300'} placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm/6`}
                                        placeholder="Enter your password"
                                        {...register("password")}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="flex h-6 shrink-0 items-center">
                                        <div className="group grid size-4 grid-cols-1">
                                            <input
                                                id="remember_me"
                                                type="checkbox"
                                                disabled={isLoading}
                                                className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                                {...register("remember_me")}
                                            />
                                            <svg
                                                fill="none"
                                                viewBox="0 0 14 14"
                                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                                            >
                                                <path
                                                    d="M3 8L6 11L11 3.5"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="opacity-0 group-has-[:checked]:opacity-100"
                                                />
                                                <path
                                                    d="M3 7H11"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="opacity-0 group-has-[:indeterminate]:opacity-100"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <label htmlFor="remember_me" className="block text-sm/6 text-gray-900">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm/6">
                                    <Link
                                        href="/forget-password"
                                        className="font-semibold text-primary hover:text-bg-primary/90"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : (
                                        "Sign in"
                                    )}
                                </button>
                            </div>
                        </form>

                        <div>
                            <div className="mt-10 flex items-center gap-x-6">
                                <div className="w-full flex-1 border-t border-gray-200" />
                                <p className="text-nowrap text-sm/6 font-medium text-gray-900">Or continue with</p>
                                <div className="w-full flex-1 border-t border-gray-200" />
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"

                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                                        <path
                                            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                                            fill="#EA4335"
                                        />
                                        <path
                                            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                                            fill="#34A853"
                                        />
                                    </svg>
                                    <span className="text-sm/6 font-semibold">Google</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isLoading}
                                    className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        // Handle GitHub OAuth
                                        // window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/github`;
                                    }}
                                >
                                    <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-[#24292F]">
                                        <path
                                            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                                            clipRule="evenodd"
                                            fillRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-sm/6 font-semibold">GitHub</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="mt-10 text-center text-sm/6 text-gray-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-semibold text-primary hover:text-bg-primary/90">
                            Register Now
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}