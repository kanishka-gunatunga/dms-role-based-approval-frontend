/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Heading from "@/components/common/Heading";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Paragraph from "@/components/common/Paragraph";
import DashboardLayout from "@/components/DashboardLayout";
import useAuth from "@/hooks/useAuth";
import React, { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownButton,
  Form,
  Modal,
  Pagination,
  Table,
} from "react-bootstrap";
import { CategoryDropdownItem } from "@/types/types";
import { AiOutlineDelete } from "react-icons/ai";
import { FaPlus } from "react-icons/fa6";
import ToastMessage from "@/components/common/Toast";
import {
  MdOutlineEdit,
  MdOutlineKeyboardDoubleArrowDown,
  MdOutlineKeyboardDoubleArrowRight,
} from "react-icons/md";
import { IoAdd, IoCheckmark, IoClose, IoFolder, IoSaveOutline, IoTrashOutline } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";
import {
  fetchCategoryChildrenData,
  fetchCategoryData,
} from "@/utils/dataFetchFunctions";
import { deleteWithAuth, getWithAuth, postWithAuth } from "@/utils/apiClient";
import { usePermissions } from "@/context/userPermissions";
import { hasPermission } from "@/utils/permission";
import { IoMdCloudDownload } from "react-icons/io";
import { RoleDropdownItem, UserDropdownItem } from "@/types/types";
import { fetchAndMapUserData, fetchRoleData } from "@/utils/dataFetchFunctions";

interface Category {
  id: number;
  parent_category: string;
  category_name: string;
  template: string;
  status: string;
  children?: Category[];
}

const initialState = {
  parent_category: "",
  category_name: "",
  description: "",
  template: ""
};

export default function AllDocTable() {
  const permissions = usePermissions();
  const [category_name, setCategoryName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("none");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [dummyData, setDummyData] = useState<Category[]>([]);
  const [categoryDropDownData, setCategoryDropDownData] = useState<
    CategoryDropdownItem[]
  >([]);
  const [collapsedRows, setCollapsedRows] = useState<Record<number, boolean>>(
    {}
  );
  const [selectedParentId, setSelectedParentId] = useState<number>();
  const [selectedItemId, setSelectedItemId] = useState<number>();
  const isAuthenticated = useAuth();
  const [editData, setEditData] = useState(initialState);
  const [attributeData, setattributeData] = useState<string[]>([]);
  const [currentAttribue, setcurrentAttribue] = useState<string>("");
  const [excelGenerated, setExcelGenerated] = useState(false);
  const [excelGeneratedLink, setExcelGeneratedLink] = useState("");
  const [errors, setErrors] = useState<any>({});


  const [users, setUsers] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userDropDownData, setUserDropDownData] = useState<UserDropdownItem[]>(
    []
  );


  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roleDropDownData, setRoleDropDownData] = useState<RoleDropdownItem[]>(
    []
  );


  const [approvalType, setApprovalType] = useState("");
  const [approvalLevels, setApprovalLevels] = useState<
    { level: number; id: string }[]
  >([]);



  const [modalStates, setModalStates] = useState({
    addCategory: false,
    addChildCategory: false,
    editModel: false,
    deleteModel: false,
  });

  useEffect(() => {
    fetchCategoryChildrenData(setDummyData);
    fetchCategoryData(setCategoryDropDownData);
  }, []);

  useEffect(() => {
    fetchAndMapUserData(setUserDropDownData);
    fetchRoleData(setRoleDropDownData);
  }, []);

  useEffect(() => {
    // console.log("se:: id::", selectedItemId);
    if (modalStates.editModel && selectedItemId !== null) {
      fetchCategoryDetails();
    }
  }, [modalStates.editModel, selectedItemId]);

  const toggleCollapse = (id: number) => {
    setCollapsedRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleEditCategorySelect = (value: string) => {
    if (value === "none") {
      setEditData((prevData) => ({
        ...prevData,
        parent_category: "none",
        // category_name: "",
      }));
    } else {
      const selectedCategory = categoryDropDownData.find(
        (item) => item.id.toString() === value
      );
      setEditData((prevData) => ({
        ...prevData,
        parent_category: selectedCategory?.id.toString() || "",
        // category_name: selectedCategory?.category_name || "",
      }));
    }
  };

  const handleOpenModal = (modalName: keyof typeof modalStates) => {
    setModalStates((prev) => ({ ...prev, [modalName]: true }));
  };

  const handleCloseModal = (modalName: keyof typeof modalStates) => {
    setModalStates((prev) => ({ ...prev, [modalName]: false }));
  };

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  const totalItems = dummyData.length;
  const totalPages = Math.ceil(dummyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const paginatedData = dummyData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const addAttribute = () => {
    if (currentAttribue.trim() !== "" && !attributeData.includes(currentAttribue.trim())) {
      setattributeData((prev) => [...prev, currentAttribue.trim()]);
      setcurrentAttribue("");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addAttribute();
    }
  };
  const updateAttribute = (index: number, value: string) => {
    setattributeData((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const removeAttribute = (index: number) => {
    setattributeData((prev) => prev.filter((_, i) => i !== index));
  };


  const validate = () => {
    const validationErrors: any = {};

    if (!category_name) {
      validationErrors.category_name = "Category Name is required.";
    }

    return validationErrors;
  };

  const handleAddCategory = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validate levels
    const emptyLevels = approvalLevels.some((lvl) => lvl.id === "");
    if (emptyLevels) {
      setToastType("error");
      setToastMessage("Please select all approval level values.");
      setShowToast(true);
      return;
    }

    setErrors({});

    const formData = new FormData();
    formData.append("parent_category", selectedCategoryId);
    formData.append("category_name", category_name || "");
    formData.append("description", description);
    formData.append("attribute_data", JSON.stringify(attributeData));

    // approval type
    formData.append("approval_type", approvalType);

    // approval levels JSON
    formData.append("approver_ids", JSON.stringify(approvalLevels));

    try {
      formData.forEach((value, key) => {
        console.log(`form data , ${key}: ${value}`);
      });

      const response = await postWithAuth(`add-category`, formData);

      if (response.status === "success") {
        setExcelGenerated(true);
        setExcelGeneratedLink(response);

        setToastType("success");
        setToastMessage("Category added successfully!");
        setShowToast(true);

        setTimeout(() => setShowToast(false), 5000);

        fetchCategoryChildrenData(setDummyData);
        fetchCategoryData(setCategoryDropDownData);
      } else {
        handleCloseModal("addCategory");

        setattributeData([]);
        setcurrentAttribue("");
        setCategoryName("");
        setSelectedCategoryId("none");
        setDescription("");
        setEditData(initialState);
        setApprovalLevels([]);

        setToastType("error");
        setToastMessage("Failed to add category!");
        setShowToast(true);

        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error) {
      setToastType("error");
      setToastMessage("Failed to add category!");
      setShowToast(true);

      setTimeout(() => setShowToast(false), 5000);
    }
  };



  const validateChild = () => {
    const validationErrors: any = {};

    if (!category_name) {
      validationErrors.category_name = "Category Name is required.";
    }

    return validationErrors;
  };
  const handleAddChildCategory = async () => {
    const validationErrors = validateChild();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {

      const formData = new FormData();
      formData.append("parent_category", selectedParentId?.toString() || "none");
      formData.append("category_name", category_name || "");
      formData.append("description", description);

      formData.append("attribute_data", JSON.stringify(attributeData))


      formData.append("approval_type", approvalType);

      // approval levels JSON
      formData.append("approver_ids", JSON.stringify(approvalLevels));

      // formData.forEach((value, key) => {
      //   console.log(`${key}: ${value}`);
      // });

      setErrors({});
      const response = await postWithAuth(`add-category`, formData);
      if (response.status === "success") {

        console.log("template_url : ", response.template_url)
        setExcelGenerated(true)
        setExcelGeneratedLink(response.template_url)

        // handleCloseModal("addChildCategory");
        setToastType("success");
        setToastMessage("Child category added successfully!");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
        fetchCategoryChildrenData(setDummyData);
        fetchCategoryData(setCategoryDropDownData);
      } else {
        handleCloseModal("addChildCategory");
        setattributeData([]);
        setcurrentAttribue('')
        setCategoryName("")
        setSelectedCategoryId("none")
        setDescription("")
        setEditData(initialState)
        setToastType("error");
        setToastMessage("Failed to add child category!");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      setToastType("error");
      setToastMessage("Failed to add child category!");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
      // console.error("Error new version updating:", error);
    }
  };


  const fetchCategoryDetails = async () => {
    // guard: nothing to load
    if (!selectedItemId) return;

    try {
      const response = await getWithAuth(`category-details/${selectedItemId}`);

      if (!response || response.status === "fail") {
        return;
      }

      // ---------- attributes (same logic, safer) ----------
      const rawAttrs = response.attributes?.attributes;
      let attributesList: string[] = [];

      if (Array.isArray(rawAttrs)) {
        attributesList = rawAttrs;
      } else if (typeof rawAttrs === "string") {
        try {
          attributesList = JSON.parse(rawAttrs);
        } catch (err) {
          console.error("Failed to parse attributes string:", err);
        }
      }

      const parsedAttributes = attributesList
        .map((attr: string) => attr.replace(/,/g, "").trim())
        .filter((attr: string) => !!attr);

      setattributeData(parsedAttributes);
      setEditData(response);

      // ---------- approval type ----------
      const type = response.approval_type || "";
      setApprovalType(type);

      // reset UI states for a clean load
      setApprovalLevels([]);
      setUsers([]);
      setRoles([]);



      let approverLevels: { level: number; id: string }[] = [];

      if (Array.isArray(response.approver_ids)) {
        approverLevels = response.approver_ids.map((item: any) => ({
          level: Number(item.level),
          id: item.id?.toString() ?? "",
        }));
      } else if (typeof response.approver_ids === "string") {
        try {
          const parsed = JSON.parse(response.approver_ids);
          approverLevels = Array.isArray(parsed)
            ? parsed.map((item: any) => ({
              level: Number(item.level),
              id: item.id?.toString() ?? "",
            }))
            : [];
        } catch {
          approverLevels = [];
        }
      }

      approverLevels.sort((a, b) => a.level - b.level);

      setApprovalLevels(approverLevels);

      if (type === "users") {
        const names = approverLevels
          .map((lvl) => {
            const found = userDropDownData.find(
              (u) => u.id.toString() === lvl.id
            );
            return found ? found.user_name : "";
          })
          .filter(Boolean);

        setUsers(names);
      }

      if (type === "roles") {
        const names = approverLevels
          .map((lvl) => {
            const found = roleDropDownData.find(
              (r) => r.id.toString() === lvl.id
            );
            return found ? found.role_name : "";
          })
          .filter(Boolean);

        setRoles(names);
      }


      console.log("Loaded Category Details:", response);
    } catch (error) {
      console.error("Error loading category details:", error);
    }
  };



  const validateEdit = () => {
    const validationErrors: any = {};

    if (!editData.category_name || editData.category_name.trim() === "") {
      validationErrors.category_name = "Category Name is required.";
    }

    return validationErrors;
  };

  const handleEditCategory = async () => {

    console.log("editing category id:", selectedItemId);
    const validationErrors = validateEdit();
    if (Object.keys(validationErrors).length > 0) {
      console.log("validation errors:", validationErrors);
      setErrors(validationErrors);
      return;
    }

    // validate: no empty approval level dropdowns
    if (approvalLevels.some((lvl) => lvl.id === "")) {
      setToastType("error");
      setToastMessage("Please select all approval level values.");
      setShowToast(true);
      return;
    }

    try {
      console.log("inside edit try:", editData);
      const formData = new FormData();
      formData.append("parent_category", editData.parent_category || "");
      formData.append("category_name", editData.category_name || "");
      formData.append("description", editData.description);
      formData.append("attribute_data", JSON.stringify(attributeData));

      // approval type
      formData.append("approval_type", approvalType);

      // approver_ids (levels)
      formData.append("approver_ids", JSON.stringify(approvalLevels));

      formData.forEach((value, key) => {
        console.log(`edit fetch ${key}: ${value}`);
      });

      const response = await postWithAuth(
        `category-details/${selectedItemId}`,
        formData
      );

      if (response.status === "success") {
        handleCloseModal("editModel");

        // reset UI cleanly after success
        setApprovalLevels([]);
        setApprovalType("");
        setattributeData([]);
        setcurrentAttribue("");
        setCategoryName("");
        setSelectedCategoryId("none");
        setDescription("");
        setEditData(initialState);

        setToastType("success");
        setToastMessage("Category updated successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);

        fetchCategoryChildrenData(setDummyData);
        fetchCategoryData(setCategoryDropDownData);
      } else {
        handleCloseModal("editModel");

        setApprovalLevels([]);
        setApprovalType("");
        setattributeData([]);
        setcurrentAttribue("");
        setCategoryName("");
        setSelectedCategoryId("none");
        setDescription("");
        setEditData(initialState);

        setToastType("error");
        setToastMessage("Failed to update category!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error) {
      handleCloseModal("editModel");

      setToastType("error");
      setToastMessage("Failed to update category!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };



  const handleDeleteCategory = async () => {
    // console.log("delete", selectedItemId);
    try {
      const response = await getWithAuth(
        `delete-category/${selectedItemId}`
      );
      if (response.status === "success") {
        handleCloseModal("deleteModel");
        setToastType("success");
        setToastMessage("Category disabled successfully!");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
        fetchCategoryChildrenData(setDummyData);
        fetchCategoryData(setCategoryDropDownData);
      } else {
        handleCloseModal("deleteModel");
        setToastType("error");
        setToastMessage("Failed to disable category!");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      handleCloseModal("deleteModel");
      setToastType("error");
      setToastMessage("Failed to disable category!");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
      // console.error("Error new version updating:", error);
    }
  };

  const handleUserSelect = (userId: string) => {
    const selectedUser = userDropDownData.find(
      (user) => user.id.toString() === userId
    );

    if (selectedUser && !selectedUserIds.includes(userId)) {
      setSelectedUserIds([...selectedUserIds, userId]);
      setUsers([...users, selectedUser.user_name]);


    }
  };

  const handleUserRemove = (userName: string) => {
    const userToRemove = userDropDownData.find(
      (user) => user.user_name === userName
    );

    if (userToRemove) {
      setSelectedUserIds(
        selectedUserIds.filter((id) => id !== userToRemove.id.toString())
      );
      setUsers(users.filter((r) => r !== userName));


    }
  };

  const handleRoleSelect = (roleId: string) => {
    const selectedRole = roleDropDownData.find(
      (role) => role.id.toString() === roleId
    );

    if (selectedRole && !selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
      setRoles([...roles, selectedRole.role_name]);


    }
  };

  const handleRemoveRole = (roleName: string) => {
    const roleToRemove = roleDropDownData.find(
      (role) => role.role_name === roleName
    );

    if (roleToRemove) {
      setSelectedRoleIds(
        selectedRoleIds.filter((id) => id !== roleToRemove.id.toString())
      );
      setRoles(roles.filter((r) => r !== roleName));
    }
  };


  const removeLevel = (levelToRemove: number) => {
    const filtered = approvalLevels.filter((item) => item.level !== levelToRemove);

    // Renumber levels (1,2,3,4...)
    const renumbered = filtered.map((item, index) => ({
      level: index + 1,
      id: item.id
    }));

    setApprovalLevels(renumbered);
  };

  return (
    <>
      <DashboardLayout>
        <div className="d-flex flex-column flex-lg-row justify-content-lg-between align-items-lg-center pt-2">
          <Heading text="Document Categories" color="#444" />
          {hasPermission(
            permissions,
            "Document Categories",
            "Manage Document Category"
          ) && (
              <div className="d-flex mt-2 mt-lg-0">
                <button
                  onClick={() => handleOpenModal("addCategory")}
                  className="addButton bg-white text-dark border border-success rounded px-3 py-1"
                >
                  <FaPlus className="me-1" /> Add Document Category
                </button>
              </div>
            )}
        </div>
        <div className="d-flex flex-column bg-white p-2 p-lg-3 rounded mt-3">
          <div>
            <div
              style={{ maxHeight: "380px", overflowY: "auto" }}
              className="custom-scroll"
            >
              <Table responsive>
                <thead className="sticky-header">
                  <tr>
                    <th className="text-center" style={{ width: "10%" }}></th>
                    <th className="text-start" style={{ width: "20%" }}>
                      Action
                    </th>
                    <th className="text-start" style={{ width: "70%" }}>
                      Name
                    </th>
                    <th className="text-start" style={{ width: "70%" }}>
                      Template
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-bottom" >
                          <td className="border-0">
                            <button
                              onClick={() => toggleCollapse(item.id)}
                              className="custom-icon-button text-secondary"
                            >
                              {collapsedRows[item.id] ? (
                                <MdOutlineKeyboardDoubleArrowDown
                                  fontSize={20}
                                />
                              ) : (
                                <MdOutlineKeyboardDoubleArrowRight
                                  fontSize={20}
                                />
                              )}
                            </button>
                          </td>
                          <td className="border-0">
                            <div className="d-flex flex-row">
                              {hasPermission(
                                permissions,
                                "Document Categories",
                                "Manage Document Category"
                              ) && (
                                  <button
                                    onClick={() => {
                                      handleOpenModal("editModel");
                                      setSelectedItemId(item.id);
                                    }}
                                    className="custom-icon-button button-success px-3 py-1 rounded me-2"
                                  >
                                    <MdOutlineEdit fontSize={16} className="me-1" />{" "}
                                    Edit
                                  </button>
                                )}

                              {hasPermission(
                                permissions,
                                "Document Categories",
                                "Manage Document Category"
                              ) && (
                                  <button
                                    onClick={() => {
                                      handleOpenModal("deleteModel");
                                      setSelectedItemId(item.id);
                                    }}
                                    className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
                                  >
                                    <AiOutlineDelete
                                      fontSize={16}
                                      className="me-1"
                                    />{" "}
                                    Disable
                                  </button>
                                )}
                            </div>
                          </td>
                          <td className="border-0">
                            <div className="d-flex flex-row align-items-center">
                              {item.category_name}
                              <span className={`ms-2 mb-0 badge ${item.status === 'active' ? 'active-badge' : 'inactive-badge'}`}>
                                {item.status}
                              </span>
                            </div>
                          </td>

                          {/* <td className="border-0">{item.category_name} <span>{item.status}</span></td> */}
                          <td className="border-0">
                            <div className="col-12 col-lg-12 d-flex flex-column pe-2">
                              {item.status === 'active' && (
                                <a href={item.template} download style={{ color: "#333" }} className="d-flex flex-row align-items-center ms-0">
                                  <div className="d-flex flex-row align-items-center custom-icon-button button-success px-3 py-1 rounded">
                                    <IoMdCloudDownload />
                                    <p className="ms-3 mb-0">Download Template</p>
                                  </div>
                                </a>
                              )}
                            </div>
                          </td>

                        </tr>

                        {collapsedRows[item.id] && (
                          <tr>
                            <td
                              colSpan={3}
                              style={{
                                paddingLeft: "10%",
                                paddingRight: "10%",
                              }}
                            >
                              <table className="table rounded">
                                <thead>
                                  <tr className="border-bottom" >
                                    <td colSpan={2}>
                                      <div className="d-flex flex-column flex-lg-row justify-content-lg-between align-items-lg-center">
                                        <div className="col-lg-auto pe-lg-3 mb-2 mb-lg-0">
                                          <Paragraph
                                            color="#333"
                                            text="Child Categories"
                                          />
                                        </div>
                                        <div className="col-lg-7 text-end">
                                          {hasPermission(
                                            permissions,
                                            "Document Categories",
                                            "Manage Document Category"
                                          ) && (
                                              <button
                                                onClick={() => {
                                                  handleOpenModal(
                                                    "addChildCategory"
                                                  );
                                                  setSelectedParentId(item.id);
                                                }}
                                                className="addButton bg-success text-white border border-success rounded px-3 py-1"
                                              >
                                                <FaPlus className="me-1" /> Add Child Category
                                              </button>
                                            )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th className="text-start">Actions</th>
                                    <th className="text-start">Name</th>
                                    <th className="text-start">
                                      Template
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.children && item.children.length > 0 ? (
                                    item.children.map((child) => (
                                      <tr key={child.id} className="border-bottom" >
                                        <td className=" border-0">
                                          <div className="d-flex flex-row">
                                            {hasPermission(
                                              permissions,
                                              "Document Categories",
                                              "Manage Document Category"
                                            ) && (
                                                <button
                                                  onClick={() => {
                                                    handleOpenModal("editModel");
                                                    setSelectedItemId(child.id);
                                                  }}
                                                  className="custom-icon-button button-success px-3 py-1 rounded me-2"
                                                >
                                                  <MdOutlineEdit
                                                    fontSize={16}
                                                    className="me-1"
                                                  />{" "}
                                                  Edit
                                                </button>
                                              )}
                                            {hasPermission(
                                              permissions,
                                              "Document Categories",
                                              "Manage Document Category"
                                            ) && (
                                                <button
                                                  onClick={() => {
                                                    handleOpenModal("deleteModel");
                                                    setSelectedItemId(child.id);
                                                  }}
                                                  className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
                                                >
                                                  <AiOutlineDelete
                                                    fontSize={16}
                                                    className="me-1"
                                                  />{" "}
                                                  Disable
                                                </button>
                                              )}
                                          </div>
                                        </td>
                                        {/* <td className=" border-0">{child.category_name}</td> */}
                                        <td className="border-0">
                                          {child.category_name}
                                          <span className={`ms-2 mb-0 badge ${item.status === 'active' ? 'active-badge' : 'inactive-badge'}`}>
                                            {item.status}
                                          </span>
                                        </td>

                                        <td className=" border-0">
                                          <div className="col-12 col-lg-12 d-flex flex-column pe-2">
                                            <a href={child.template} download style={{ color: "#333" }} className="d-flex flex-row align-items-center ms-0 ">
                                              <div className="d-flex flex-row align-items-center custom-icon-button button-success px-3 py-1 rounded ">
                                                <IoMdCloudDownload />
                                                <p className="ms-3 mb-0">Download Template</p>
                                              </div>
                                            </a>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={2}
                                        className="text-center py-3"
                                      >
                                        No child categories available.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-start w-100 py-3">
                        <Paragraph text="No data available" color="#333" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div className="d-flex flex-column flex-lg-row paginationFooter">
              <div className="d-flex justify-content-between align-items-center">
                <p className="pagintionText mb-0 me-2">Items per page:</p>
                <Form.Select
                  onChange={handleItemsPerPageChange}
                  value={itemsPerPage}
                  style={{
                    width: "100px",
                    padding: "5px 10px !important",
                    fontSize: "12px",
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </Form.Select>
              </div>
              <div className="d-flex flex-row align-items-center px-lg-5">
                <div className="pagination-info" style={{ fontSize: "14px" }}>
                  {startIndex} – {endIndex} of {totalItems}
                </div>

                <Pagination className="ms-3">
                  <Pagination.Prev
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Next
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </div>
          </div>
        </div>
        <ToastMessage
          message={toastMessage}
          show={showToast}
          onClose={() => setShowToast(false)}
          type={toastType}
        />
      </DashboardLayout>

      {/* add parent */}
      <Modal
        centered
        show={modalStates.addCategory}
        onHide={() => {
          handleCloseModal("addCategory");
          setattributeData([]);
          setcurrentAttribue('')
          setCategoryName("")
          setSelectedCategoryId("none")
          setDescription("")
          setEditData(initialState)
        }}
      >
        <Modal.Header>
          <div className="d-flex w-100 justify-content-end">
            <div className="col-11 d-flex flex-row">
              <IoFolder fontSize={20} className="me-2" />
              <p className="mb-0" style={{ fontSize: "16px", color: "#333" }}>
                Add New Category
              </p>
            </div>
            <div className="col-1 d-flex justify-content-end">
              <IoClose
                fontSize={20}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  handleCloseModal("addCategory")
                  setattributeData([]);
                  setcurrentAttribue('')
                  setCategoryName("")
                  setSelectedCategoryId("none")
                  setDescription("")
                  setEditData(initialState)
                }}
              />
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="py-3">
          <div
            className="d-flex flex-column custom-scroll mb-3"
            style={{ maxHeight: "450px", overflowY: "auto" }}
          >
            <div className="col-12 col-lg-12 d-flex flex-column mb-2 pe-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Parent Category
              </p>
              <DropdownButton
                id="dropdown-category-button"
                title={
                  selectedCategoryId === "none"
                    ? "None"
                    : categoryDropDownData.find(
                      (item) => item.id.toString() === selectedCategoryId
                    )?.category_name || "Select Category"
                }
                className="custom-dropdown-text-start text-start w-100"
                onSelect={(value) => handleCategorySelect(value || "")}
              >
                <Dropdown.Item
                  key="none"
                  eventKey="none"
                  style={{
                    fontWeight: "bold",
                    marginLeft: "0px",
                  }}
                >
                  None
                </Dropdown.Item>
                {categoryDropDownData
                  .filter((category) => category.parent_category === "none")
                  .map((category) => (
                    <Dropdown.Item
                      key={category.id}
                      eventKey={category.id.toString()}
                      style={{
                        fontWeight: "bold",
                        marginLeft: "0px",
                      }}
                    >
                      {category.category_name}
                    </Dropdown.Item>
                  ))}
              </DropdownButton>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2 pe-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Category Name
              </p>
              <div className="input-group d-flex flex-column w-100">
                <input
                  type="text"
                  className="form-control w-100"
                  value={category_name}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                {errors.category_name && <div style={{ color: "red", fontSize: "13px" }}>{errors.category_name}</div>}
              </div>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2 pe-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Description
              </p>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column">
              <p
                className="mb-1 text-start w-100"
                style={{ fontSize: "14px" }}
              >
                Attributes
              </p>
              <div className="col-12">
                <div
                  style={{ marginBottom: "10px" }}
                  className="w-100 d-flex metaBorder"
                >
                  <input
                    type="text"
                    value={currentAttribue}
                    onChange={(e) => setcurrentAttribue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a attribute"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      border: "1px solid #ccc",
                      borderTopRightRadius: "0px !important",
                      borderBottomRightRadius: "0px !important",
                      backgroundColor: 'transparent',
                      color: "#333",
                    }}
                  />
                  <button
                    onClick={addAttribute}
                    className="successButton"
                    style={{
                      padding: "10px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "1px solid #4CAF50",
                      borderLeft: "none",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <IoAdd />
                  </button>
                </div>
                <div>
                  {attributeData.map((tag, index) => (
                    <div
                      key={index}
                      className="metaBorder"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) =>
                          updateAttribute(index, e.target.value)
                        }
                        style={{
                          flex: 1,
                          borderRadius: "0px",
                          backgroundColor: 'transparent',
                          border: "1px solid #ccc",
                          color: "#333",
                          padding: "6px 10px",
                        }}
                      />
                      <button
                        onClick={() => removeAttribute(index)}
                        className="dangerButton"
                        style={{
                          padding: "10px !important",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "1px solid #4CAF50",
                          borderLeft: "none",
                          borderTopRightRadius: "4px",
                          borderBottomRightRadius: "4px",
                          cursor: "pointer",
                          height: "34px"
                        }}
                      >
                        <IoTrashOutline />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2 pe-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Approval Workflow
              </p>

              {/* Approval Type Dropdown */}
              <div className="d-flex flex-column mb-3">
                <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                  Approval Type
                </p>

                <DropdownButton
                  id="dropdown-approval-type"
                  title={approvalType ? approvalType : "Select Approval Type"}
                  className="custom-dropdown-text-start text-start w-100"
                  onSelect={(value: string | null) => {
                    if (value) {
                      setApprovalType(value as "users" | "roles" | "");
                      setApprovalLevels([]); // reset levels
                    }
                  }}
                >
                  <Dropdown.Item eventKey="">Select One</Dropdown.Item>
                  <Dropdown.Item eventKey="users">Users</Dropdown.Item>
                  <Dropdown.Item eventKey="roles">Roles</Dropdown.Item>
                </DropdownButton>
              </div>

              {/* Add Level button */}
              {approvalType && (
                <button
                  onClick={() =>
                    setApprovalLevels((prev) => [
                      ...prev,
                      { level: prev.length + 1, id: "" },
                    ])
                  }
                  className="btn btn-success text-white mb-3"
                  style={{ fontSize: "13px" }}
                >
                  Add Approval Level
                </button>
              )}

              {/* Dynamic Levels */}
              {approvalLevels.map((item, index) => {
                // filter used IDs
                const filteredUsers = userDropDownData.filter(
                  (u) =>
                    !approvalLevels.some(
                      (lvl) => lvl.id === u.id.toString() && lvl.level !== item.level
                    )
                );

                const filteredRoles = roleDropDownData.filter(
                  (r) =>
                    !approvalLevels.some(
                      (lvl) => lvl.id === r.id.toString() && lvl.level !== item.level
                    )
                );

                return (
                  <div
                    key={item.level}
                    className="p-2 mb-3 position-relative"
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      background: "#fafafa",
                    }}
                  >
                    {/* Remove Level Button */}
                    <IoClose
                      size={18}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        cursor: "pointer",
                        color: "red",
                      }}
                      onClick={() => removeLevel(item.level)}
                    />

                    {/* Level Label */}
                    <p
                      className="text-center"
                      style={{
                        fontSize: "10px",
                        color: "gray",
                        marginBottom: "5px",
                        marginTop: "0px",
                      }}
                    >
                      Level {item.level}
                    </p>

                    {/* Dropdown */}
                    <DropdownButton
                      id={`approval-level-${item.level}`}
                      title={
                        approvalType === "users"
                          ? userDropDownData.find((u) => u.id.toString() === item.id)
                            ?.user_name || "Select User"
                          : roleDropDownData.find((r) => r.id.toString() === item.id)
                            ?.role_name || "Select Role"
                      }
                      className="custom-dropdown-text-start text-start w-100"
                      onSelect={(value: string | null) => {
                        if (value) {
                          const updated = [...approvalLevels];
                          updated[index].id = value;
                          setApprovalLevels(updated);
                        }
                      }}
                    >
                      {/* No more options CASE */}
                      {approvalType === "users" && filteredUsers.length === 0 && (
                        <Dropdown.Item disabled>No more users available</Dropdown.Item>
                      )}

                      {approvalType === "roles" && filteredRoles.length === 0 && (
                        <Dropdown.Item disabled>No more roles available</Dropdown.Item>
                      )}

                      {/* Users */}
                      {approvalType === "users" &&
                        filteredUsers.map((user) => (
                          <Dropdown.Item key={user.id} eventKey={user.id.toString()}>
                            {user.user_name}
                          </Dropdown.Item>
                        ))}

                      {/* Roles */}
                      {approvalType === "roles" &&
                        filteredRoles.map((role) => (
                          <Dropdown.Item key={role.id} eventKey={role.id.toString()}>
                            {role.role_name}
                          </Dropdown.Item>
                        ))}
                    </DropdownButton>

                    {/* Required message */}
                    {item.id === "" && (
                      <small style={{ color: "red", fontSize: "11px" }}>
                        Please select a value for this level
                      </small>
                    )}
                  </div>
                );
              })}
            </div>



            {
              excelGenerated && (
                <div className="col-12 col-lg-12 d-flex flex-column ps-lg-2 pe-2">
                  <a href={excelGeneratedLink} download style={{ color: "#333" }} className="d-flex flex-row align-items-center ms-0 ">
                    <div className="d-flex flex-row align-items-center custom-icon-button button-success px-3 py-1 rounded ">
                      <IoMdCloudDownload />
                      <p className="ms-3 mb-0">Download Template</p>
                    </div>
                  </a>
                </div>
              )
            }
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex flex-row">
            <button
              onClick={() => handleAddCategory()}
              className="custom-icon-button button-success px-3 py-1 rounded me-2"
            >
              <IoSaveOutline fontSize={16} className="me-1" /> Save
            </button>
            <button
              onClick={() => {
                handleCloseModal("addCategory");
                setattributeData([]);
                setcurrentAttribue('')
                setCategoryName("")
                setSelectedCategoryId("none")
                setDescription("")
                setEditData(initialState)
              }}
              className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
            >
              <MdOutlineCancel fontSize={16} className="me-1" /> Cancel
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* add child */}
      <Modal
        centered
        show={modalStates.addChildCategory}
        onHide={() => {
          handleCloseModal("addChildCategory");
          setattributeData([]);
          setcurrentAttribue('')
          setCategoryName("")
          setSelectedCategoryId("none")
          setDescription("")
          setEditData(initialState)
        }}
      >
        <Modal.Header>
          <div className="d-flex w-100 justify-content-end">
            <div className="col-11 d-flex flex-row">
              <IoFolder fontSize={20} className="me-2" />
              <p className="mb-0" style={{ fontSize: "16px", color: "#333" }}>
                Add New Category
              </p>
            </div>
            <div className="col-1 d-flex justify-content-end">
              <IoClose
                fontSize={20}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  handleCloseModal("addChildCategory")
                  setattributeData([]);
                  setcurrentAttribue('')
                  setCategoryName("")
                  setSelectedCategoryId("none")
                  setDescription("")
                  setEditData(initialState)
                }}
              />
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="py-3">
          <div
            className="d-flex flex-column custom-scroll mb-3"
            style={{ maxHeight: "450px", overflowY: "auto" }}
          >
            <div className="col-12 col-lg-12 d-flex flex-column mb-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Parent Category
              </p>
              <DropdownButton
                id="dropdown-category-button"
                title={
                  selectedCategoryId.toString() === "none"
                    ? "None"
                    : selectedCategoryId
                      ? categoryDropDownData.find(
                        (item) => item.id.toString() === selectedCategoryId
                      )?.category_name || "Select Category"
                      : "Select Category"
                }
                className="custom-dropdown-text-start text-start w-100"
                onSelect={(value) => handleCategorySelect(value || "none")}
              >
                <Dropdown.Item
                  key="none"
                  eventKey="none"
                  style={{
                    fontWeight: "bold",
                    marginLeft: "0px",
                  }}
                >
                  None
                </Dropdown.Item>
                {categoryDropDownData
                  .filter((category) => category.parent_category === "none")
                  .map((category) => (
                    <Dropdown.Item
                      key={category.id}
                      eventKey={category.id.toString()}
                      style={{
                        fontWeight: "bold",
                        marginLeft: "0px",
                      }}
                    >
                      {category.category_name}
                    </Dropdown.Item>
                  ))}
              </DropdownButton>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Category Name
              </p>
              <div className="input-group d-flex flex-column w-100">
                <input
                  type="text"
                  className="form-control w-100"
                  value={category_name}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                {errors.category_name && <div style={{ color: "red", fontSize: "13px" }}>{errors.category_name}</div>}
              </div>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Description
              </p>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column ps-lg-2 pe-2">
              <p
                className="mb-1 text-start w-100"
                style={{ fontSize: "14px" }}
              >
                Attributes
              </p>
              <div className="col-12">
                <div
                  style={{ marginBottom: "10px" }}
                  className="w-100 d-flex metaBorder"
                >
                  <input
                    type="text"
                    value={currentAttribue}
                    onChange={(e) => setcurrentAttribue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a attribute"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      border: "1px solid #ccc",
                      borderTopRightRadius: "0px !important",
                      borderBottomRightRadius: "0px !important",
                      backgroundColor: 'transparent',
                      color: "#333",
                    }}
                  />
                  <button
                    onClick={addAttribute}
                    className="successButton"
                    style={{
                      padding: "10px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "1px solid #4CAF50",
                      borderLeft: "none",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <IoAdd />
                  </button>
                </div>
                <div>
                  {attributeData.map((tag, index) => (
                    <div
                      key={index}
                      className="metaBorder"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) =>
                          updateAttribute(index, e.target.value)
                        }
                        style={{
                          flex: 1,
                          borderRadius: "0px",
                          backgroundColor: 'transparent',
                          border: "1px solid #ccc",
                          color: "#333",
                          padding: "6px 10px",
                        }}
                      />
                      <button
                        onClick={() => removeAttribute(index)}
                        className="dangerButton"
                        style={{
                          padding: "10px !important",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "1px solid #4CAF50",
                          borderLeft: "none",
                          borderTopRightRadius: "4px",
                          borderBottomRightRadius: "4px",
                          cursor: "pointer",
                          height: "34px"
                        }}
                      >
                        <IoTrashOutline />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2 pe-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Approval Workflow
              </p>

              {/* Approval Type Dropdown */}
              <div className="d-flex flex-column mb-3">
                <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                  Approval Type
                </p>

                <DropdownButton
                  id="dropdown-approval-type"
                  title={approvalType ? approvalType : "Select Approval Type"}
                  className="custom-dropdown-text-start text-start w-100"
                  onSelect={(value: string | null) => {
                    if (value) {
                      setApprovalType(value as "users" | "roles" | "");
                      setApprovalLevels([]); // reset levels
                    }
                  }}
                >
                  <Dropdown.Item eventKey="">Select One</Dropdown.Item>
                  <Dropdown.Item eventKey="users">Users</Dropdown.Item>
                  <Dropdown.Item eventKey="roles">Roles</Dropdown.Item>
                </DropdownButton>
              </div>

              {/* Add Level button */}
              {approvalType && (
                <button
                  onClick={() =>
                    setApprovalLevels((prev) => [
                      ...prev,
                      { level: prev.length + 1, id: "" },
                    ])
                  }
                  className="btn btn-success text-white mb-3"
                  style={{ fontSize: "13px" }}
                >
                  Add Approval Level
                </button>
              )}

              {/* Dynamic Levels */}
              {approvalLevels.map((item, index) => {
                // filter used IDs
                const filteredUsers = userDropDownData.filter(
                  (u) =>
                    !approvalLevels.some(
                      (lvl) => lvl.id === u.id.toString() && lvl.level !== item.level
                    )
                );

                const filteredRoles = roleDropDownData.filter(
                  (r) =>
                    !approvalLevels.some(
                      (lvl) => lvl.id === r.id.toString() && lvl.level !== item.level
                    )
                );

                return (
                  <div
                    key={item.level}
                    className="p-2 mb-3 position-relative"
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      background: "#fafafa",
                    }}
                  >
                    {/* Remove Level Button */}
                    <IoClose
                      size={18}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        cursor: "pointer",
                        color: "red",
                      }}
                      onClick={() => removeLevel(item.level)}
                    />

                    {/* Level Label */}
                    <p
                      className="text-center"
                      style={{
                        fontSize: "10px",
                        color: "gray",
                        marginBottom: "5px",
                        marginTop: "0px",
                      }}
                    >
                      Level {item.level}
                    </p>

                    {/* Dropdown */}
                    <DropdownButton
                      id={`approval-level-${item.level}`}
                      title={
                        approvalType === "users"
                          ? userDropDownData.find((u) => u.id.toString() === item.id)
                            ?.user_name || "Select User"
                          : roleDropDownData.find((r) => r.id.toString() === item.id)
                            ?.role_name || "Select Role"
                      }
                      className="custom-dropdown-text-start text-start w-100"
                      onSelect={(value: string | null) => {
                        if (value) {
                          const updated = [...approvalLevels];
                          updated[index].id = value;
                          setApprovalLevels(updated);
                        }
                      }}
                    >
                      {/* No more options CASE */}
                      {approvalType === "users" && filteredUsers.length === 0 && (
                        <Dropdown.Item disabled>No more users available</Dropdown.Item>
                      )}

                      {approvalType === "roles" && filteredRoles.length === 0 && (
                        <Dropdown.Item disabled>No more roles available</Dropdown.Item>
                      )}

                      {/* Users */}
                      {approvalType === "users" &&
                        filteredUsers.map((user) => (
                          <Dropdown.Item key={user.id} eventKey={user.id.toString()}>
                            {user.user_name}
                          </Dropdown.Item>
                        ))}

                      {/* Roles */}
                      {approvalType === "roles" &&
                        filteredRoles.map((role) => (
                          <Dropdown.Item key={role.id} eventKey={role.id.toString()}>
                            {role.role_name}
                          </Dropdown.Item>
                        ))}
                    </DropdownButton>

                    {/* Required message */}
                    {item.id === "" && (
                      <small style={{ color: "red", fontSize: "11px" }}>
                        Please select a value for this level
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
            {
              excelGenerated && (
                <div className="col-12 col-lg-12 d-flex flex-column ps-lg-2 pe-2">
                  <a href={excelGeneratedLink} download style={{ color: "#333" }} className="d-flex flex-row align-items-center ms-0 ">
                    <div className="d-flex flex-row align-items-center custom-icon-button button-success px-3 py-1 rounded ">
                      <IoMdCloudDownload />
                      <p className="ms-3 mb-0">Download Template</p>
                    </div>
                  </a>
                </div>
              )
            }
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex flex-row">
            <button
              onClick={() => handleAddChildCategory()}
              className="custom-icon-button button-success px-3 py-1 rounded me-2"
            >
              <IoSaveOutline fontSize={16} className="me-1" /> Save
            </button>
            <button
              onClick={() => {
                handleCloseModal("addChildCategory");
                setattributeData([]);
                setcurrentAttribue('')
                setCategoryName("")
                setSelectedCategoryId("none")
                setDescription("")
                setEditData(initialState)
              }}
              className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
            >
              <MdOutlineCancel fontSize={16} className="me-1" /> Cancel
            </button>
          </div>
        </Modal.Footer>
      </Modal>


      {/* edit */}
      <Modal
        centered
        show={modalStates.editModel}
        onHide={() => {
          handleCloseModal("editModel");
          setattributeData([]);
          setcurrentAttribue('')
          setCategoryName("")
          setSelectedCategoryId("none")
          setDescription("")
          setEditData(initialState)
        }}
      >
        <Modal.Header>
          <div className="d-flex w-100 justify-content-end">
            <div className="col-11 d-flex flex-row">
              <IoFolder fontSize={20} className="me-2" />
              <p className="mb-0" style={{ fontSize: "16px", color: "#333" }}>
                Edit Category
              </p>
            </div>
            <div className="col-1 d-flex justify-content-end">
              <IoClose
                fontSize={20}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  handleCloseModal("editModel")
                  setattributeData([]);
                  setcurrentAttribue('')
                  setCategoryName("")
                  setSelectedCategoryId("none")
                  setDescription("")
                  setEditData(initialState)
                }}
              />
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="py-3">
          <div
            className="d-flex flex-column custom-scroll mb-3"
            style={{ maxHeight: "300px", overflowY: "auto" }}
          >
            <div className="col-12 col-lg-12 d-flex flex-column mb-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Parent Category
              </p>
              <DropdownButton
                id="dropdown-category-button"
                title={
                  editData.parent_category === "none"
                    ? "None"
                    : categoryDropDownData.find(
                      (item) =>
                        item.id.toString() === editData.parent_category
                    )?.category_name || "Select Category"
                }
                className="custom-dropdown-text-start text-start w-100"
                onSelect={(value) => handleEditCategorySelect(value || "")}
              >
                <Dropdown.Item
                  key="none"
                  eventKey="none"
                  style={{
                    fontWeight: "bold",
                    marginLeft: "0px",
                  }}
                >
                  None
                </Dropdown.Item>

                {categoryDropDownData
                  .filter((category) => category.parent_category === "none")
                  .map((category) => (
                    <Dropdown.Item
                      key={category.id}
                      eventKey={category.id.toString()}
                      style={{
                        fontWeight: "bold",
                        marginLeft: "0px",
                      }}
                    >
                      {category.category_name}
                    </Dropdown.Item>
                  ))}
              </DropdownButton>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Category Name
              </p>
              <div className="input-group d-flex flex-column w-100">
                <input
                  type="text"
                  className="form-control w-100"
                  value={editData.category_name}
                  onChange={(e) =>
                    setEditData((prevData) => ({
                      ...prevData,
                      category_name: e.target.value,
                    }))
                  }
                />
                {errors.category_name && <div style={{ color: "red", fontSize: "13px" }}>{errors.category_name}</div>}
              </div>
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column mb-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Description
              </p>
              <textarea
                className="form-control"
                value={editData.description}
                onChange={(e) =>
                  setEditData((prevData) => ({
                    ...prevData,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="col-12 col-lg-12 d-flex flex-column ps-lg-2">
              <p
                className="mb-1 text-start w-100"
                style={{ fontSize: "14px" }}
              >
                Attributes
              </p>
              <div className="col-12">
                <div
                  style={{ marginBottom: "10px" }}
                  className="w-100 d-flex metaBorder"
                >
                  <input
                    type="text"
                    value={currentAttribue}
                    onChange={(e) => setcurrentAttribue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a attribute"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      border: "1px solid #ccc",
                      borderTopRightRadius: "0 !important",
                      borderBottomRightRadius: "0 !important",
                      backgroundColor: 'transparent',
                      color: "#333",
                    }}
                  />
                  <button
                    onClick={addAttribute}
                    className="successButton"
                    style={{
                      padding: "10px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "1px solid #4CAF50",
                      borderLeft: "none",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <IoAdd />
                  </button>
                </div>
                <div>
                  {attributeData.map((tag, index) => (
                    <div
                      key={index}
                      className="metaBorder"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) =>
                          updateAttribute(index, e.target.value)
                        }
                        style={{
                          flex: 1,
                          borderRadius: "0px",
                          backgroundColor: 'transparent',
                          border: "1px solid #ccc",
                          color: "#333",
                          padding: "6px 10px",
                        }}
                      />
                      <button
                        onClick={() => removeAttribute(index)}
                        className="dangerButton"
                        style={{
                          padding: "10px !important",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "1px solid #4CAF50",
                          borderLeft: "none",
                          borderTopRightRadius: "4px",
                          borderBottomRightRadius: "4px",
                          cursor: "pointer",
                          height: "34px"
                        }}
                      >
                        <IoTrashOutline />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-12 d-flex flex-column mb-2 pe-2">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Approval Workflow
              </p>

              {/* Approval Type Dropdown */}
              <div className="d-flex flex-column mb-3">
                <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                  Approval Type
                </p>

                <DropdownButton
                  id="dropdown-approval-type-edit"
                  title={approvalType ? approvalType : "Select Approval Type"}
                  className="custom-dropdown-text-start text-start w-100"
                  onSelect={(value: string | null) => {
                    if (value) {
                      setApprovalType(value as "users" | "roles" | "");
                      // reset all existing approval levels when type changes
                      setApprovalLevels([]);
                    }
                  }}
                >
                  <Dropdown.Item eventKey="">Select One</Dropdown.Item>
                  <Dropdown.Item eventKey="users">Users</Dropdown.Item>
                  <Dropdown.Item eventKey="roles">Roles</Dropdown.Item>
                </DropdownButton>
              </div>

              {/* Add Approval Level Button */}
              {approvalType && (
                <button
                  type="button"
                  onClick={() =>
                    setApprovalLevels((prev) => [
                      ...prev,
                      { level: prev.length + 1, id: "" },
                    ])
                  }
                  className="btn btn-success text-white mb-3"
                  style={{ fontSize: "13px" }}
                >
                  Add Approval Level
                </button>
              )}

              {/* Dynamic Levels */}
              {approvalLevels.map((item, index) => {
                // used ids except current level (so the dropdown keeps showing its own selected id)
                const usedIds = approvalLevels
                  .filter((lvl) => lvl.level !== item.level)
                  .map((lvl) => lvl.id);

                const availableUsers = userDropDownData.filter(
                  (u) => !usedIds.includes(u.id.toString()) || u.id.toString() === item.id
                );

                const availableRoles = roleDropDownData.filter(
                  (r) => !usedIds.includes(r.id.toString()) || r.id.toString() === item.id
                );

                return (
                  <div
                    key={`approval-level-card-${item.level}`}
                    className="p-2 mb-3 position-relative"
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      background: "#fafafa",
                    }}
                  >
                    {/* Remove level button */}
                    <IoClose
                      size={16}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setApprovalLevels((prev) =>
                          prev
                            .filter((lvl) => lvl.level !== item.level)
                            .map((lvl, i) => ({ level: i + 1, id: lvl.id }))
                        );
                      }}
                    />

                    {/* Level Title */}
                    <p
                      className="text-center"
                      style={{
                        fontSize: "10px",
                        color: "gray",
                        marginBottom: "5px",
                        marginTop: "0px",
                      }}
                    >
                      Level {item.level}
                    </p>

                    {/* Dropdown */}
                    <DropdownButton
                      id={`approval-level-${item.level}`}
                      title={
                        approvalType === "users"
                          ? availableUsers.find((u) => u.id.toString() === item.id)
                            ?.user_name || "Select User"
                          : availableRoles.find((r) => r.id.toString() === item.id)
                            ?.role_name || "Select Role"
                      }
                      className="custom-dropdown-text-start text-start w-100"
                      onSelect={(value: string | null) => {
                        if (!value) return;

                        setApprovalLevels((prev) => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], id: value };
                          return updated;
                        });
                      }}
                    >
                      {/* Users */}
                      {approvalType === "users" &&
                        availableUsers.map((user) => (
                          <Dropdown.Item
                            key={`user-${user.id}`}
                            eventKey={user.id.toString()}
                          >
                            {user.user_name}
                          </Dropdown.Item>
                        ))}

                      {/* Roles */}
                      {approvalType === "roles" &&
                        availableRoles.map((role) => (
                          <Dropdown.Item
                            key={`role-${role.id}`}
                            eventKey={role.id.toString()}
                          >
                            {role.role_name}
                          </Dropdown.Item>
                        ))}
                    </DropdownButton>
                  </div>
                );
              })}
            </div>
            {
              editData.template && (
                <div className="col-12 col-lg-12 d-flex flex-column mt-2 pe-2">
                  <a href={editData.template} download style={{ color: "#333" }} className="d-flex flex-row align-items-center ms-0 ">
                    <div className="d-flex flex-row align-items-center custom-icon-button button-success px-3 py-1 rounded ">
                      <IoMdCloudDownload />
                      <p className="ms-3 mb-0">Download Template</p>
                    </div>
                  </a>
                </div>
              )
            }

          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex flex-row">
            <button
              onClick={() => handleEditCategory()}
              className="custom-icon-button button-success px-3 py-1 rounded me-2"
            >
              <IoSaveOutline fontSize={16} className="me-1" /> Save
            </button>
            <button
              onClick={() => {
                handleCloseModal("editModel");
                setattributeData([]);
                setcurrentAttribue('')
                setCategoryName("")
                setSelectedCategoryId("none")
                setDescription("")
                setEditData(initialState)
              }}
              className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
            >
              <MdOutlineCancel fontSize={16} className="me-1" /> Cancel
            </button>
          </div>
        </Modal.Footer>
      </Modal>


      {/* delete */}
      <Modal
        centered
        show={modalStates.deleteModel}
        onHide={() => handleCloseModal("deleteModel")}
      >
        <Modal.Body>
          <div className="d-flex flex-column">
            <div className="d-flex w-100 justify-content-end">
              <div className="col-11 d-flex flex-row py-3">
                <p
                  className="mb-0 text-danger"
                  style={{ fontSize: "18px", color: "#333" }}
                >
                  Are you sure you want to disable?
                </p>
              </div>
              <div className="col-1 d-flex justify-content-end">
                <IoClose
                  fontSize={20}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCloseModal("deleteModel")}
                />
              </div>
            </div>
            <div className="d-flex flex-row">
              <button
                onClick={() => handleDeleteCategory()}
                className="custom-icon-button button-success px-3 py-1 rounded me-2"
              >
                <IoCheckmark fontSize={16} className="me-1" /> Yes
              </button>
              <button
                onClick={() => {
                  handleCloseModal("deleteModel");
                }}
                className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
              >
                <MdOutlineCancel fontSize={16} className="me-1" /> No
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
