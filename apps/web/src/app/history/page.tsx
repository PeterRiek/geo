import { redirect } from "next/navigation";

const HistoryPage = () => {
  redirect("/profile?tab=history");
};

export default HistoryPage;
