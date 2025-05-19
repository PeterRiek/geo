"use client";

import { logout } from "@/lib/actions/auth";
import React, { useEffect } from "react";

const SessionExpiredPage = () => {
  useEffect(() => {
    logout();
  }, []);
  return <div>SessionExpiredPage</div>;
};

export default SessionExpiredPage;
