import { useState, useEffect } from "react";
import {
  FileText,
  Users,
  Plus,
  Moon,
  Sun,
  Trash2,
  Edit,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  employeeService,
  salaryRecordService,
  Employee,
  SalaryRecordWithExpenses,
} from "@/lib/db";

interface Expense {
  id: string;
  category: string;
  amount: number;
  expense_day: number;
  expense_month: number;
  expense_year: number;
}

export default function Index() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecordWithExpenses[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showDeleteEmployeeConfirm, setShowDeleteEmployeeConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    name: "",
    position: "",
  });

  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [selectedRecordEmployeeId, setSelectedRecordEmployeeId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [recordSalary, setRecordSalary] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategory, setExpenseCategory] = useState("Fuel");
  const [customExpenseCategory, setCustomExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDay, setExpenseDay] = useState(new Date().getDate());
  const [expenseMonth, setExpenseMonth] = useState(new Date().getMonth());
  const [expenseYear, setExpenseYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoadingData(true);
      const [employeesData, recordsData] = await Promise.all([
        employeeService.getAll(user.id),
        salaryRecordService.getAll(user.id),
      ]);
      setEmployees(employeesData);
      setSalaryRecords(recordsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "true") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, [user]);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("darkMode", String(newDark));
    if (newDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const handleAddEmployee = () => {
    setEmployeeFormData({ name: "", position: "" });
    setSelectedEmployee(null);
    setShowAddEmployeeModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeFormData({
      name: employee.name,
      position: employee.position,
    });
    setShowEditEmployeeModal(true);
  };

  const handleDeleteEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteEmployeeConfirm(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee || !user) return;

    try {
      await employeeService.delete(user.id, selectedEmployee.id);
      await loadData();
      toast.success("Employee deleted successfully");
      setShowDeleteEmployeeConfirm(false);
      setSelectedEmployee(null);
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const submitEmployeeForm = async () => {
    if (!employeeFormData.name.trim() || !employeeFormData.position.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) return;

    try {
      if (showEditEmployeeModal && selectedEmployee) {
        await employeeService.update(
          user.id,
          selectedEmployee.id,
          employeeFormData.name,
          employeeFormData.position
        );
        toast.success("Employee updated successfully");
        setShowEditEmployeeModal(false);
      } else {
        await employeeService.create(
          user.id,
          employeeFormData.name,
          employeeFormData.position
        );
        toast.success("Employee added successfully");
        setShowAddEmployeeModal(false);
      }
      await loadData();
      setEmployeeFormData({ name: "", position: "" });
      setSelectedEmployee(null);
    } catch (error) {
      toast.error("Failed to save employee");
    }
  };

  const handleAddRecord = () => {
    if (employees.length === 0) {
      toast.error("Please add an employee first");
      return;
    }
    setSelectedRecordEmployeeId(employees[0].id);
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
    setRecordSalary("");
    setExpenses([]);
    setExpenseAmount("");
    setExpenseDay(new Date().getDate());
    setExpenseMonth(new Date().getMonth());
    setExpenseYear(new Date().getFullYear());
    setExpenseCategory("Fuel");
    setShowAddRecordModal(true);
  };

  const expenseCategories = [
    "Fuel",
    "Bonus",
    "Food",
    "Medical",
    "Equipments",
    "Other",
  ];

  const addExpense = () => {
    if (!expenseAmount.trim()) {
      toast.error("Please enter expense amount");
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (expenseCategory === "Other" && !customExpenseCategory.trim()) {
      toast.error("Please enter a custom category name");
      return;
    }

    const finalCategory =
      expenseCategory === "Other" ? customExpenseCategory : expenseCategory;

    const newExpense: Expense = {
      id: Date.now().toString(),
      category: finalCategory,
      amount,
      expense_day: expenseDay,
      expense_month: expenseMonth,
      expense_year: expenseYear,
    };

    setExpenses([...expenses, newExpense]);
    setExpenseAmount("");
    setCustomExpenseCategory("");
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const submitSalaryRecord = async () => {
    if (!selectedRecordEmployeeId) {
      toast.error("Please select an employee");
      return;
    }

    if (!recordSalary.trim()) {
      toast.error("Please enter salary amount");
      return;
    }

    const salary = parseFloat(recordSalary);
    if (isNaN(salary)) {
      toast.error("Please enter a valid salary");
      return;
    }

    if (!user) return;

    try {
      await salaryRecordService.create(
        user.id,
        selectedRecordEmployeeId,
        selectedMonth,
        selectedYear,
        salary,
        expenses.map(e => ({
          category: e.category,
          amount: e.amount,
          expense_day: e.expense_day,
          expense_month: e.expense_month,
          expense_year: e.expense_year,
        }))
      );
      await loadData();
      toast.success("Salary record saved successfully");
      setShowAddRecordModal(false);
      setExpenses([]);
      setExpenseAmount("");
    } catch (error) {
      toast.error("Failed to save salary record");
    }
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.name || "Unknown";
  };

  const getMonthName = (monthIndex: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthIndex];
  };

  const calculateGrandTotal = () => {
    const salary = parseFloat(recordSalary) || 0;
    const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    return salary + expensesTotal;
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isDark ? "dark" : ""} min-h-screen bg-slate-50 dark:bg-slate-950 py-4 px-3 sm:py-8 sm:px-4`}
    >
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 sm:gap-2 flex-wrap">
                  <span>₹</span>
                  <span className="break-words">Power Moon TechMed</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  Salary Tracker For PowerMoon
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
              <button
                onClick={toggleDarkMode}
                className="rounded-full bg-gray-100 dark:bg-slate-800 p-2 sm:p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-100 dark:bg-red-900 p-2 sm:p-3 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">
              Manage employee compensation records
            </p>
            {user && (
              <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                Welcome, {user.name}!
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Button
            onClick={handleAddEmployee}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 sm:py-6 text-sm sm:text-lg rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px]"
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Add Employee</span>
          </Button>
          <Button
            onClick={handleAddRecord}
            disabled={employees.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 sm:py-6 text-sm sm:text-lg rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px]"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Add Record</span>
          </Button>
        </div>

        {/* Employees Table or Empty State */}
        {employees.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-16 text-center">
            <Users className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400">
              No employees yet. Add your first employee to get started!
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEmployeeClick(employee)}
                          className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-slate-700">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {employee.name}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Position
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {employee.position}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-3 rounded-lg transition-colors min-h-[44px]"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEmployeeClick(employee)}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 px-3 py-3 rounded-lg transition-colors min-h-[44px]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salary Records */}
        {salaryRecords.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Salary Records
              </h2>
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Month/Year
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Salary
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Expenses
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Grand Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {salaryRecords.map((record) => {
                    const expensesTotal = record.expenses.reduce(
                      (sum, e) => sum + e.amount,
                      0
                    );
                    const grandTotal = record.salary + expensesTotal;
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {getEmployeeName(record.employee_id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {getMonthName(record.month)} {record.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          ₹{record.salary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {record.expenses.length > 0 ? (
                            <div className="space-y-1">
                              {record.expenses.map((e) => (
                                <div key={e.id} className="text-xs">
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {e.category}
                                  </span>
                                  {" - "}
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {e.expense_day} {monthNames[e.expense_month]} {e.expense_year}
                                  </span>
                                  {" : "}
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    ₹{e.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              <div className="font-semibold text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-slate-700 pt-1 mt-1">
                                Subtotal: ₹{expensesTotal.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                          ₹{grandTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-slate-700">
              {salaryRecords.map((record) => {
                const expensesTotal = record.expenses.reduce(
                  (sum, e) => sum + e.amount,
                  0
                );
                const grandTotal = record.salary + expensesTotal;
                return (
                  <div key={record.id} className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Employee
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {getEmployeeName(record.employee_id)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Month/Year
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {getMonthName(record.month)} {record.year}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Salary
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ₹{record.salary.toLocaleString()}
                      </p>
                    </div>

                    {record.expenses.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                          Expenses
                        </p>
                        <div className="space-y-1 text-xs">
                          {record.expenses.map((e) => (
                            <div
                              key={e.id}
                              className="flex justify-between text-gray-700 dark:text-gray-300"
                            >
                              <span>
                                {e.category} ({e.expense_day} {monthNames[e.expense_month]})
                              </span>
                              <span className="font-semibold">
                                ₹{e.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 dark:border-slate-700 pt-1 mt-1 flex justify-between font-semibold text-blue-600 dark:text-blue-400">
                            <span>Subtotal:</span>
                            <span>₹{expensesTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">
                        Grand Total
                      </p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        ₹{grandTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 my-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Add Employee
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={employeeFormData.name}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Employee name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={employeeFormData.position}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      position: e.target.value,
                    })
                  }
                  placeholder="Job position"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setEmployeeFormData({ name: "", position: "" });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={submitEmployeeForm}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium min-h-[44px]"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 my-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Edit Employee
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={employeeFormData.name}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Employee name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={employeeFormData.position}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      position: e.target.value,
                    })
                  }
                  placeholder="Job position"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
              <button
                onClick={() => {
                  setShowEditEmployeeModal(false);
                  setEmployeeFormData({ name: "", position: "" });
                  setSelectedEmployee(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={submitEmployeeForm}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium min-h-[44px]"
              >
                Update Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {showDeleteEmployeeConfirm && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 my-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Delete Employee
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-8">
              Are you sure you want to delete{" "}
              <strong>{selectedEmployee.name}</strong>? This action cannot be
              undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowDeleteEmployeeConfirm(false);
                  setSelectedEmployee(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEmployee}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Salary Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Add Salary Record
            </h2>

            <div className="space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employee
                </label>
                <select
                  value={selectedRecordEmployeeId}
                  onChange={(e) => setSelectedRecordEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month and Year Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((month, index) => (
                      <option key={index} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salary
                </label>
                <input
                  type="number"
                  value={recordSalary}
                  onChange={(e) => setRecordSalary(e.target.value)}
                  placeholder="Enter salary amount"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Other Expenses Section */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Other Expenses
                </h3>

                {/* Add Expense Form */}
                <div className="space-y-4 mb-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 p-5 rounded-xl border border-blue-200 dark:border-slate-600">
                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Expense Category
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-blue-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Category Input */}
                  {expenseCategory === "Other" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Custom Category Name
                      </label>
                      <input
                        type="text"
                        value={customExpenseCategory}
                        onChange={(e) =>
                          setCustomExpenseCategory(e.target.value)
                        }
                        placeholder="e.g., Travel, Utilities, Software"
                        className="w-full px-4 py-2 border border-blue-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-2 border border-blue-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Expense Date
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={expenseDay}
                        onChange={(e) =>
                          setExpenseDay(parseInt(e.target.value))
                        }
                        className="px-3 py-2 border border-blue-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={expenseMonth}
                        onChange={(e) =>
                          setExpenseMonth(parseInt(e.target.value))
                        }
                        className="px-3 py-2 border border-blue-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {monthNames.map((month, idx) => (
                          <option key={idx} value={idx}>
                            {month}
                          </option>
                        ))}
                      </select>

                      <select
                        value={expenseYear}
                        onChange={(e) =>
                          setExpenseYear(parseInt(e.target.value))
                        }
                        className="px-3 py-2 border border-blue-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {[expenseYear - 1, expenseYear, expenseYear + 1].map(
                          (year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={addExpense}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                  >
                    + Add Expense
                  </button>
                </div>

                {/* Expenses List */}
                {expenses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {expenses.length} Expense
                      {expenses.length !== 1 ? "s" : ""} Added
                    </p>
                    {expenses.map((expense, idx) => {
                      const dateStr = `${expense.expense_day} ${monthNames[expense.expense_month]} ${expense.expense_year}`;
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {expense.category}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {dateStr}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              ₹{expense.amount.toLocaleString()}
                            </p>
                            <button
                              onClick={() => removeExpense(expense.id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-lg transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4 bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <p>
                    Salary: ₹{(parseFloat(recordSalary) || 0).toLocaleString()}
                  </p>
                  <p>
                    Expenses: ₹
                    {expenses
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Grand Total: ₹{calculateGrandTotal().toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRecordModal(false);
                  setRecordSalary("");
                  setExpenses([]);
                  setExpenseAmount("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitSalaryRecord}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
