import { redirect } from "next/navigation";

export default function MatchesIndexRedirect() {
  redirect("/dashboard");
}
