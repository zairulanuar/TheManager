import { redirect } from "next/navigation";

export default function Home() {
  // Redirect users immediately to the login page
  redirect("/auth/login");
}