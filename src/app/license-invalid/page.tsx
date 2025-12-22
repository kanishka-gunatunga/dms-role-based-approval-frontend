/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import Paragraph from "@/components/common/Paragraph";
import Image from "next/image";
import React, { useState } from "react";
import ToastMessage from "@/components/common/Toast";
import { Input } from "antd";
import { API_BASE_URL } from "@/utils/apiClient";
import { useCompanyProfile } from "@/context/userCompanyProfile";

const page = () => {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const { data } = useCompanyProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!key.trim()) {
      setToastType("error");
      setToastMessage("License key is required");
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("key", key);

      const response = await fetch(`${API_BASE_URL}license/apply`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "License activation failed");
      }

      setToastType("success");
      setToastMessage("License activated successfully");
      setShowToast(true);

      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (error: any) {
      setToastType("error");
      setToastMessage(error.message || "Invalid license key");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = data?.logo_url || "/logo.png";
  const bannerUrl = data?.banner_url || "/login-image.png";

  return (
    <>
      <div
        className="d-flex flex-column flex-lg-row w-100"
        style={{ minHeight: "100svh", maxHeight: "100svh" }}
      >
        <div
          className="col-12 col-lg-8 d-none d-lg-block"
          style={{
            minHeight: "100svh",
            maxHeight: "100svh",
            backgroundColor: "#EBF2FB",
          }}
        >
          <Image
            src={bannerUrl}
            alt=""
            width={1000}
            height={800}
            className="img-fluid"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div
          className="col-12 col-md-6 align-self-center col-lg-4 px-4 px-lg-5 d-flex flex-column justify-content-center align-items-center"
          style={{ minHeight: "100svh", maxHeight: "100svh" }}
        >
          <Image
            src={imageUrl}
            alt=""
            width={200}
            height={150}
            className="img-fluid mb-3 loginLogo"
          />

          <Paragraph text="Activate License" color="Paragraph" />

          <form
            className="d-flex flex-column px-0 px-lg-3"
            style={{ width: "100%" }}
            onSubmit={handleSubmit}
          >
            <label className="mt-3">License Key</label>
            <Input.TextArea
              rows={4}
              placeholder="Paste your license key here"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />

            <button
              type="submit"
              className="loginButton text-white mt-4"
              disabled={loading}
            >
              {loading ? "Activating..." : "Activate License"}
            </button>
          </form>
        </div>
      </div>

      <ToastMessage
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />
    </>
  );
};

export default page;
