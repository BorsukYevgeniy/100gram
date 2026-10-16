import { redirect } from "next/navigation";

export default function GoogleAuthSuccess() {
  redirect("/");
}
