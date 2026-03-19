import { Questionnaire } from "@/components/screening/questionnaire";

export const metadata = {
  title: "Eligibility Screening – CarbonFarm.io",
  description: "Check if your land qualifies for VM0047 ARR carbon credits.",
};

export default function ScreenPage() {
  return <Questionnaire />;
}
