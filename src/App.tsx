import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  FileText, 
  Settings, 
  Search, 
  Bell, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  MoreVertical, 
  Plus, 
  Filter, 
  Download,
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Menu,
  X,
  History,
  Info,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  MessageSquare,
  Send,
  Sparkles,
  LogOut,
  TrendingDown,
  ArrowRightLeft,
  Edit,
  Edit3,
  Trash2,
  ClipboardList,
  Printer,
  Users,
  UserCheck,
  RotateCcw,
  Warehouse,
  Activity,
  PackageX,
  AlertTriangle,
  DollarSign,
  Scale,
  Coins,
  Percent,
  FileCheck,
  MinusCircle,
  PieChart as PieChartIcon,
  Loader2,
  Database,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

// --- Types ---
interface Product {
  id: string;
  name: string;
  name_en?: string;
  sku: string;
  barcode?: string;
  electronic_invoice_code?: string;
  coding_type?: string;
  is_assembly?: boolean;
  is_service?: boolean;
  has_expiry?: boolean;
  has_serial?: boolean;
  stop_sale?: boolean;
  stop_purchase?: boolean;
  concrete_type?: 'normal' | 'reinforced';
  part_numbers?: string[];
  additional_statement?: string;
  no_points?: boolean;
  no_discount?: boolean;
  for_rent?: boolean;
  category: string;
  categories?: string[]; // Multiple categories
  group_id?: string;
  groups?: string[]; // Multiple groups
  unit: string;
  brand_id?: string;
  model_id?: string;
  origin?: string;
  warranty?: string;
  quantity: number;
  cost_price: number;
  sale_price: number; // Retail
  wholesale_price?: number;
  half_wholesale_price?: number;
  min_sale_price?: number;
  last_purchase_price?: number;
  avg_purchase_price?: number;
  market_price?: number;
  manual_cost?: number;
  profit_percent_retail?: number;
  profit_percent_wholesale?: number;
  profit_percent_half_wholesale?: number;
  profit_percent_min_sale?: number;
  discount_retail?: number;
  discount_wholesale?: number;
  discount_half_wholesale?: number;
  min_stock: number;
  max_stock?: number;
  warehouse_id: string;
  tax_percent?: number;
  is_active?: boolean;
}

interface SalesRepresentative {
  id: string;
  name: string;
  phone: string;
  commission_percent: number;
}

interface ShippingCompany {
  id: string;
  name: string;
  phone: string;
}

interface CostCenter {
  id: string;
  name: string;
  code: string;
}

interface TransactionItem {
  product_id: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  net_amount: number;
  total: number;
  notes?: string;
}

interface Transaction {
  id: string;
  type: 'sale' | 'purchase' | 'sale_return' | 'purchase_return';
  invoice_type: 'cash' | 'credit' | 'visa';
  payment_method?: 'cash' | 'check' | 'bank' | 'credit';
  document_number?: string;
  party_id: string;
  date: string;
  time: string;
  warehouse_id: string;
  account_id: string; // Box or Bank
  sales_rep_id?: string;
  shipping_co_id?: string;
  cost_center_id?: string;
  project_id?: string;
  branch_id?: string;
  currency_id: string;
  exchange_rate: number;
  pricing_type: 'retail' | 'wholesale' | 'half_wholesale';
  transport_car_id?: string;
  transport_driver_id?: string;
  is_delivery?: boolean;
  delivery_notes?: string;
  items: TransactionItem[];
  total_amount: number;
  total_items_amount: number;
  total_discount: number;
  total_tax: number;
  net_amount: number;
  paid_amount: number;
  remaining_amount: number;
  profit?: number;
  notes?: string;
}

interface StockAdjustmentItem {
  product_id: string;
  quantity: number;
  type: 'in' | 'out';
}

interface StockAdjustment {
  id: string;
  date: string;
  warehouse_id: string;
  items: StockAdjustmentItem[];
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

// ... existing interfaces ...

interface FinancialDocument {
  id: string;
  type: 'receipt' | 'payment' | 'settlement' | 'check';
  number: string;
  date: string;
  party_id: string;
  account_id: string; // Box or Bank
  amount: number;
  currency_id: string;
  exchange_rate: number;
  cost_center_id?: string;
  notes?: string;
  status?: 'pending' | 'cleared' | 'bounced'; // For checks
  due_date?: string; // For checks
}

interface Quote {
  id: string;
  quote_number: string;
  party_name: string;
  date: string;
  total_amount: number;
  status: 'pending' | 'converted' | 'expired';
}

interface Account {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
}

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  method: string;
  amount: number;
  date: string;
  description: string;
}

interface Transfer {
  id: string;
  date: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  items: { product_id: string; quantity: number }[];
  notes?: string;
}

interface Adjustment {
  id: string;
  type: 'in' | 'out';
  date: string;
  warehouse_id: string;
  reason: string;
  items: { product_id: string; quantity: number }[];
  notes?: string;
}

interface Stats {
  totalSales: number;
  totalPurchases: number;
  inventoryValue: number;
  cashBalance: number;
}

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
}

// --- Components ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface COATreeNodeProps {
  account: Account;
  allAccounts: Account[];
  level?: number;
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
}

const COATreeNode: React.FC<COATreeNodeProps> = ({ account, allAccounts, level = 0, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const children = allAccounts.filter(a => a.parent_id === account.id);
  const hasChildren = children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 p-3 hover:bg-[#141414]/5 cursor-pointer transition-colors border-b border-[#141414]/5",
          level === 0 ? "font-bold bg-[#141414]/5" : "text-sm"
        )}
        style={{ paddingRight: `${level * 24 + 12}px` }}
      >
        <div className="flex-1 flex items-center gap-2" onClick={() => setIsOpen(!isOpen)}>
          {hasChildren ? (
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft size={16} className="opacity-50" />
            </motion.div>
          ) : (
            <div className="w-[16px]" />
          )}
          <span className="font-mono text-[10px] opacity-40 bg-[#141414] text-white px-1 rounded-sm">{account.code}</span>
          <span className="flex-1">{account.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase opacity-40 px-2 py-0.5 bg-[#141414]/10 rounded-full">
            {account.type === 'asset' ? 'أصول' : 
             account.type === 'liability' ? 'خصوم' : 
             account.type === 'equity' ? 'حقوق' : 
             account.type === 'revenue' ? 'إيرادات' : 'مصروفات'}
          </span>
          <span className="text-sm font-mono font-bold min-w-[100px] text-left">
            {account.balance.toLocaleString()} ج.م
          </span>
          <div className="flex gap-1">
            <button onClick={() => onEdit?.(account)} className="p-1 hover:bg-[#141414]/10 text-blue-600 rounded transition-colors">
              <Edit size={12} />
            </button>
            <button onClick={() => onDelete?.(account.id)} className="p-1 hover:bg-[#141414]/10 text-red-600 rounded transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children.map(child => (
              <COATreeNode 
                key={child.id} 
                account={child} 
                allAccounts={allAccounts} 
                level={level + 1} 
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, hidden }: { icon: any, label: string, active: boolean, onClick: () => void, hidden?: boolean }) => {
  if (hidden) return null;
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg mb-1 group",
        active ? "bg-white/10 text-white shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={18} className={cn(active ? "text-white" : "opacity-50 group-hover:opacity-100")} />
      <span className="font-sans font-bold text-xs">{label}</span>
      {active && <div className="mr-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
};

const CollapsibleSidebarItem = ({ icon: Icon, label, children, isOpen, onToggle }: { icon: any, label: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) => {
  return (
    <div className="w-full mb-1">
      <button 
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 text-white/70 hover:bg-white/5 rounded-lg group",
          isOpen && "text-white"
        )}
      >
        <Icon size={18} className="opacity-50 group-hover:opacity-100" />
        <span className="font-sans font-bold text-xs">{label}</span>
        <div className="mr-auto opacity-30 group-hover:opacity-100">
          {isOpen ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pr-4 py-1 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SubTabButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-6 py-2 text-xs font-bold transition-all duration-200 border-b-2",
      active ? "border-[#141414] text-[#141414]" : "border-transparent text-[#141414]/40 hover:text-[#141414]/60"
    )}
  >
    {label}
  </button>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: { title: string, value: string, icon: any, trend?: string, color: string }) => (
  <div className="bg-[var(--app-card-bg)] p-6 border border-[#141414]/10 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className={cn("p-2 rounded-sm", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={cn("text-[10px] font-sans font-bold px-2 py-0.5 rounded-full", trend.startsWith('+') ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-sans font-bold uppercase opacity-50 tracking-wider">{title}</p>
      <h3 className="text-2xl font-sans font-bold mt-1">{value}</h3>
    </div>
  </div>
);

const ReportCard = ({ title, description, icon: Icon, onClick }: { title: string, description: string, icon: any, onClick?: () => void }) => (
  <div 
    className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 hover:border-[#141414] transition-colors cursor-pointer group"
    onClick={onClick}
  >
    <div className="w-10 h-10 bg-[#141414]/5 flex items-center justify-center mb-4 group-hover:bg-[#141414] group-hover:text-white transition-colors">
      <Icon size={20} />
    </div>
    <h4 className="font-sans font-bold text-sm mb-2">{title}</h4>
    <p className="text-[10px] opacity-50 leading-relaxed">{description}</p>
  </div>
);

// --- Main App ---

const Toast = ({ message, type, onClose }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={cn(
      "fixed bottom-8 right-8 px-6 py-3 rounded-sm shadow-2xl z-[200] flex items-center gap-3 font-bold text-sm",
      type === 'success' ? "bg-green-600 text-white" : "bg-red-600 text-white"
    )}
  >
    {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
  </motion.div>
);

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "تأكيد", cancelText = "إلغاء", isDestructive = true }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#F5F5F3] w-full max-w-sm p-8 rounded-sm shadow-2xl relative"
        >
          <div className="mb-6">
            <h3 className="text-xl font-sans font-bold tracking-tight mb-2">{title}</h3>
            <p className="text-sm opacity-60 leading-relaxed">{message}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onConfirm}
              className={cn(
                "flex-1 py-3 font-bold text-sm transition-colors",
                isDestructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#141414] text-[#E4E3E0] hover:bg-black"
              )}
            >
              {confirmText}
            </button>
            <button 
              onClick={onCancel}
              className="flex-1 py-3 bg-[#141414]/5 text-[#141414] font-bold text-sm hover:bg-[#141414]/10 transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function App() {
  console.log('Accounting App is rendering...');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory_mgmt' | 'stock_movements' | 'sales' | 'purchase' | 'finance' | 'reports' | 'settings' | 'definitions'>('dashboard');
  const [inventoryMgmtSubTab, setInventoryMgmtSubTab] = useState<'products' | 'categories' | 'units' | 'groups' | 'brands' | 'models'>('products');
  const [stockMovementsSubTab, setStockMovementsSubTab] = useState<'log' | 'transfers' | 'adjustments' | 'warehouses'>('log');
  const [salesSubTab, setSalesSubTab] = useState<'invoices' | 'returns' | 'quotes' | 'parties'>('invoices');
  const [purchaseSubTab, setPurchaseSubTab] = useState<'invoices' | 'returns' | 'suppliers'>('invoices');
  const [financeSubTab, setFinanceSubTab] = useState<'cash' | 'accounts' | 'receipts' | 'payments' | 'settlements' | 'checks' | 'coa' | 'expenses' | 'journal'>('cash');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [reportsSubTab, setReportsSubTab] = useState<'dashboard' | 'sales' | 'inventory' | 'finance' | 'tax'>('dashboard');

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [finance, setFinance] = useState<FinancialRecord[]>([]);
  const [financialDocs, setFinancialDocs] = useState<FinancialDocument[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [suppliersCustomers, setSuppliersCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [productUnits, setProductUnits] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [productGroups, setProductGroups] = useState<any[]>([]);
  const [journalEntryLines, setJournalEntryLines] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [transportCars, setTransportCars] = useState<any[]>([]);
  const [transportDrivers, setTransportDrivers] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [supplierGroups, setSupplierGroups] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [taxTypes, setTaxTypes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [profitLossReport, setProfitLossReport] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSales: 0, totalPurchases: 0, inventoryValue: 0, cashBalance: 0 });
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', full_name: '', role: 'user', is_active: true });
  const [showUserModal, setShowUserModal] = useState(false);
  const [previousSaleInfo, setPreviousSaleInfo] = useState<any | null>(null);
  const [previousSaleSearch, setPreviousSaleSearch] = useState('');
  const [showLoginDbConfig, setShowLoginDbConfig] = useState(true);
  const [showConnectionString, setShowConnectionString] = useState(false);

  const checkPreviousSale = async (partyId: string, productId: string) => {
    if (!partyId || !productId) {
      setPreviousSaleInfo(null);
      return;
    }
    try {
      const res = await fetch(`/api/check-previous-sale?party_id=${partyId}&product_id=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setPreviousSaleInfo(data);
      } else {
        setPreviousSaleInfo(null);
      }
    } catch (err) {
      console.error(err);
      setPreviousSaleInfo(null);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ username: '', password: '', full_name: '', role: 'user', is_active: true });
        fetchUsers();
        setToast({ message: 'تم حفظ المستخدم بنجاح', type: 'success' });
      } else {
        const err = await res.json();
        setToast({ message: err.error || 'خطأ في حفظ المستخدم', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'خطأ في الاتصال بالخادم', type: 'error' });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.code2 && p.code2.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [activationKey, setActivationKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [activationError, setActivationError] = useState('');
  
  const safeJson = async (res: Response, defaultValue: any = []) => {
    try {
      const text = await res.text();
      if (!text || text.trim() === '') return defaultValue;
      return JSON.parse(text);
    } catch (e) {
      console.error('Error parsing JSON:', e, 'Response status:', res.status, 'URL:', res.url);
      return defaultValue;
    }
  };

  const [dbConnectionString, setDbConnectionString] = useState('');
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [systemSettings, setSystemSettings] = useState({
    app_name: 'المحاسب الذكي',
    font_family: 'Cairo',
    bg_color: '#E4E3E0',
    text_color: '#141414',
    heading_color: '#141414',
    detail_color: '#141414',
    card_bg: '#FFFFFF',
    default_tax_percent: 14,
    sales_account_id: '',
    sales_returns_account_id: '',
    purchases_account_id: '',
    purchase_returns_account_id: '',
    input_vat_account_id: '',
    output_vat_account_id: '',
    discount_allowed_account_id: '',
    discount_earned_account_id: '',
    other_payables_account_id: '',
    other_receivables_account_id: '',
    expenses_account_id: '',
    default_cash_account_id: '',
    default_bank_account_id: '',
  });
  const [definitionsSubTab, setDefinitionsSubTab] = useState<'general' | 'accounts'>('general');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // AI Chat State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showSCModal, setShowSCModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportFilters, setReportFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    partyId: '',
    productId: '',
    warehouseId: '',
    accountId: '',
    salesRepId: ''
  });
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showCOAModal, setShowCOAModal] = useState(false);
  const [showFinancialDocModal, setShowFinancialDocModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }]
  });
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState({
    name: '',
    type: 'cash',
    currency_id: '',
    account_number: '',
    bank_name: '',
    branch_name: '',
    initial_balance: 0,
    is_active: true,
    account_id: ''
  });
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [scForm, setSCForm] = useState<any>({ type: 'customer', name: '', phone: '', email: '', balance: 0, opening_balance: 0, group_id: '', account_id: '' });
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '', is_default: false });
  const [movementForm, setMovementForm] = useState({ product_id: '', from_warehouse_id: '', to_warehouse_id: '', quantity: 0, type: 'transfer', reason: '' });
  const [expenseForm, setExpenseForm] = useState({ id: undefined, type: 'expense', amount: 0, category_id: '', account_id: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [definitionForm, setDefinitionForm] = useState<any>({ 
    type: 'product_units', 
    name: '', 
    description: '', 
    rate: 0, 
    code: '', 
    symbol: '',
    phone: '',
    commission_percent: 0
  });
  
  const [productForm, setProductForm] = useState<any>({ 
    name: '', 
    name_en: '',
    sku: '', 
    barcode: '',
    electronic_invoice_code: '',
    coding_type: 'GS1',
    is_assembly: false,
    is_service: false,
    has_expiry: false,
    has_serial: false,
    stop_sale: false,
    stop_purchase: false,
    concrete_type: 'normal',
    part_numbers: ['', '', '', '', '', ''],
    is_taxable: true,
    additional_statement: '',
    no_points: false,
    no_discount: false,
    for_rent: false,
    category: '', 
    categories: [],
    group_id: '',
    groups: [],
    unit: 'قطعة', 
    quantity: 0, 
    cost_price: 0, 
    sale_price: 0, 
    wholesale_price: 0,
    half_wholesale_price: 0,
    min_sale_price: 0,
    last_purchase_price: 0,
    avg_purchase_price: 0,
    market_price: 0,
    manual_cost: 0,
    profit_percent_retail: 0,
    profit_percent_wholesale: 0,
    profit_percent_half_wholesale: 0,
    profit_percent_min_sale: 0,
    discount_retail: 0,
    discount_wholesale: 0,
    discount_half_wholesale: 0,
    min_stock: 0, 
    max_stock: 0,
    warehouse_id: '',
    tax_percent: Number(systemSettings.default_tax_percent || 14),
    is_active: true
  });

  const [transferForm, setTransferForm] = useState({
    date: new Date().toISOString().split('T')[0],
    from_warehouse_id: '',
    to_warehouse_id: '',
    items: [{ product_id: '', quantity: 1 }],
    notes: ''
  });

  const [stockAdjustmentForm, setStockAdjustmentForm] = useState({
    type: 'in', // 'in' or 'out'
    date: new Date().toISOString().split('T')[0],
    warehouse_id: '',
    reason: '',
    items: [{ product_id: '', quantity: 1 }],
    notes: ''
  });
  const [transactionForm, setTransactionForm] = useState<any>({
    type: 'sale',
    invoice_type: 'cash',
    payment_type: 'نقدي',
    document_number: '',
    party_id: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    warehouse_id: '',
    account_id: '',
    sales_rep_id: '',
    shipping_co_id: '',
    cost_center_id: '',
    project_id: '',
    branch_id: '',
    currency_id: '',
    exchange_rate: 1,
    pricing_type: 'retail',
    items: [{ product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, tax_percent: Number(systemSettings.default_tax_percent || 14), tax_amount: 0, net_amount: 0 }],
    total_items_amount: 0,
    total_discount: 0,
    total_tax: 0,
    net_amount: 0,
    paid_amount: 0,
    due_amount: 0,
    remaining_amount: 0,
    transport_car_id: '',
    transport_driver_id: '',
    is_delivery: false,
    delivery_notes: '',
    notes: ''
  });

  const [quoteForm, setQuoteForm] = useState({
    party_id: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ product_id: '', quantity: 1, unit_price: 0 }],
    notes: ''
  });

  const [coaForm, setCOAForm] = useState({
    name: '',
    code: '',
    type: 'asset' as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
    parent_id: '',
    description: ''
  });

  const [financialDocForm, setFinancialDocForm] = useState<any>({
    type: 'receipt',
    number: '',
    date: new Date().toISOString().split('T')[0],
    party_id: '',
    account_id: '',
    amount: 0,
    currency_id: '',
    exchange_rate: 1,
    cost_center_id: '',
    notes: '',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0]
  });

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    inventory_mgmt: true,
    stock_movements: false,
    sales: false,
    finance: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [salesReps, setSalesReps] = useState<SalesRepresentative[]>([]);
  const [shippingCos, setShippingCos] = useState<ShippingCompany[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    console.log('Fetching all data...');
    try {
      // If we are a setup admin, not logged in, or the database is not fully connected, only load public system settings & DB status
      if (!currentUser || currentUser.role === 'setup_admin' || dbStatus !== 'connected') {
        const [settingsRes, dbStatusRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/settings/db-status')
        ]);
        if (settingsRes.ok) {
          const data = await safeJson(settingsRes);
          setSystemSettings(prev => ({ ...prev, ...data }));
        }
        if (dbStatusRes.ok) {
          const data = await safeJson(dbStatusRes);
          setDbStatus(data.status);
          setDbConnectionString(data.connectionString || '');
        }
        return;
      }

      const [
        productsRes, 
        transactionsRes, 
        financeRes, 
        scRes, 
        warehousesRes, 
        expenseCatsRes, 
        accountsRes, 
        movementsRes,
        unitsRes,
        categoriesRes,
        cGroupsRes,
        sGroupsRes,
        payMethodsRes,
        taxTypesRes,
        currenciesRes,
        deptsRes,
        coaRes,
        quotesRes,
        statsRes,
        settingsRes,
        dbStatusRes,
        salesRepsRes,
        shippingCosRes,
        costCentersRes,
        financialDocsRes,
        transfersRes,
        adjustmentsRes,
        projectsRes,
        branchesRes,
        brandsRes,
        modelsRes,
        productGroupsRes,
        journalEntryLinesRes,
        journalEntriesRes,
        transportCarsRes,
        transportDriversRes
      ] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/transactions'),
        fetch('/api/finance'),
        fetch('/api/suppliers-customers'),
        fetch('/api/warehouses'),
        fetch('/api/expense-categories'),
        fetch('/api/bank-accounts'),
        fetch('/api/stock-movements'),
        fetch('/api/product-units'),
        fetch('/api/product-categories'),
        fetch('/api/customer-groups'),
        fetch('/api/supplier-groups'),
        fetch('/api/payment-methods'),
        fetch('/api/tax-types'),
        fetch('/api/currencies'),
        fetch('/api/departments'),
        fetch('/api/coa'),
        fetch('/api/quotes'),
        fetch('/api/stats'),
        fetch('/api/settings'),
        fetch('/api/settings/db-status'),
        fetch('/api/sales-reps'),
        fetch('/api/shipping-cos'),
        fetch('/api/cost-centers'),
        fetch('/api/financial-docs'),
        fetch('/api/transfers'),
        fetch('/api/adjustments'),
        fetch('/api/projects'),
        fetch('/api/branches'),
        fetch('/api/brands'),
        fetch('/api/models'),
        fetch('/api/product-groups'),
        fetch('/api/journal-entry-lines'),
        fetch('/api/journal-entries'),
        fetch('/api/transport-cars'),
        fetch('/api/transport-drivers')
      ]);

      if (productsRes.ok) {
        const data = await safeJson(productsRes);
        setProducts(data.map((p: any) => ({
          ...p,
          quantity: Number(p.quantity || 0),
          cost_price: Number(p.cost_price || 0),
          sale_price: Number(p.sale_price || 0),
          min_stock: Number(p.min_stock || 0)
        })));
      }
      if (transactionsRes.ok) {
        const data = await safeJson(transactionsRes);
        setTransactions(data.map((t: any) => ({
          ...t,
          total_amount: Number(t.total_amount || 0),
          tax_amount: Number(t.tax_amount || 0),
          items: (t.items || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            total: Number(item.total || 0),
            tax_amount: Number(item.tax_amount || 0),
            net_amount: Number(item.net_amount || 0),
            discount_amount: Number(item.discount_amount || 0)
          }))
        })));
      }
      if (financeRes.ok) {
        const data = await safeJson(financeRes);
        setFinance(data.map((f: any) => ({ ...f, amount: Number(f.amount || 0) })));
      }
      if (scRes.ok) {
        const data = await safeJson(scRes);
        setSuppliersCustomers(data.map((sc: any) => ({ 
          ...sc, 
          balance: Number(sc.balance || 0),
          opening_balance: Number(sc.opening_balance || 0)
        })));
      }
      if (warehousesRes.ok) setWarehouses(await safeJson(warehousesRes));
      if (journalEntriesRes.ok) setJournalEntries(await safeJson(journalEntriesRes));
      if (expenseCatsRes.ok) setExpenseCategories(await safeJson(expenseCatsRes));
      if (accountsRes.ok) {
        const data = await safeJson(accountsRes);
        setBankAccounts(data.map((ba: any) => ({ ...ba, balance: Number(ba.balance || 0) })));
      }
      if (movementsRes.ok) setStockMovements(await safeJson(movementsRes));
      if (unitsRes.ok) setProductUnits(await safeJson(unitsRes));
      if (categoriesRes.ok) setProductCategories(await safeJson(categoriesRes));
      if (cGroupsRes.ok) setCustomerGroups(await safeJson(cGroupsRes));
      if (sGroupsRes.ok) setSupplierGroups(await safeJson(sGroupsRes));
      if (payMethodsRes.ok) setPaymentMethods(await safeJson(payMethodsRes));
      if (taxTypesRes.ok) setTaxTypes(await safeJson(taxTypesRes));
      if (currenciesRes.ok) setCurrencies(await safeJson(currenciesRes));
      if (deptsRes.ok) setDepartments(await safeJson(deptsRes));
      if (coaRes.ok) setChartOfAccounts(await safeJson(coaRes));
      if (quotesRes.ok) setQuotes(await safeJson(quotesRes));
      if (statsRes.ok) setStats(await safeJson(statsRes, stats));
      if (salesRepsRes.ok) setSalesReps(await safeJson(salesRepsRes));
      if (shippingCosRes.ok) setShippingCos(await safeJson(shippingCosRes));
      if (costCentersRes.ok) setCostCenters(await safeJson(costCentersRes));
      if (financialDocsRes.ok) setFinancialDocs(await safeJson(financialDocsRes));
      if (transfersRes.ok) setTransfers(await safeJson(transfersRes));
      if (adjustmentsRes.ok) setAdjustments(await safeJson(adjustmentsRes));
      if (projectsRes.ok) setProjects(await safeJson(projectsRes));
      if (branchesRes.ok) setBranches(await safeJson(branchesRes));
      if (brandsRes.ok) setBrands(await safeJson(brandsRes));
      if (modelsRes.ok) setModels(await safeJson(modelsRes));
      if (productGroupsRes.ok) setProductGroups(await safeJson(productGroupsRes));
      if (journalEntryLinesRes.ok) setJournalEntryLines(await safeJson(journalEntryLinesRes));
      if (transportCarsRes.ok) setTransportCars(await safeJson(transportCarsRes));
      if (transportDriversRes.ok) setTransportDrivers(await safeJson(transportDriversRes));
      // ... rest of the settings ...
      if (settingsRes.ok) {
        const s = await safeJson(settingsRes, {});
        if (s && Object.keys(s).length > 0) setSystemSettings(prev => ({ ...prev, ...s }));
      }
      if (dbStatusRes.ok) {
        const status = await safeJson(dbStatusRes, { status: 'error' });
        setDbStatus(status.status);
        if (status.connectionString) {
          setDbConnectionString(status.connectionString);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleProductDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف المنتج',
      message: 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const fetchNextDocNumber = async (type: string) => {
    try {
      const res = await fetch(`/api/transactions/next-number/${type}`);
      if (res.ok) {
        const data = await safeJson(res, {});
        setTransactionForm(prev => ({ ...prev, document_number: data.next_number }));
        return data.next_number;
      }
    } catch (err) {
      console.error('Error fetching next doc number:', err);
    }
    return '';
  };

  const openNewTransaction = (type: 'sale' | 'purchase' | 'sale_return' | 'purchase_return') => {
    setEditingTransaction(null);
    setTransactionForm({
      type,
      invoice_type: 'cash',
      payment_type: 'نقدي',
      document_number: '',
      party_id: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      warehouse_id: warehouses.find(w => w.is_default)?.id || warehouses[0]?.id || '',
      account_id: systemSettings.default_cash_account_id || bankAccounts[0]?.id || '',
      sales_rep_id: '',
      shipping_co_id: '',
      cost_center_id: '',
      project_id: '',
      branch_id: '',
      currency_id: currencies[0]?.id || '',
      exchange_rate: 1,
      pricing_type: 'retail',
      items: [{ product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, tax_percent: Number(systemSettings.default_tax_percent || 14), tax_amount: 0, net_amount: 0 }],
      total_items_amount: 0,
      total_discount: 0,
      total_tax: 0,
      net_amount: 0,
      paid_amount: 0,
      due_amount: 0,
      remaining_amount: 0,
      transport_car_id: '',
      transport_driver_id: '',
      is_delivery: false,
      delivery_notes: '',
      notes: ''
    });
    fetchNextDocNumber(type);
    setShowTransactionModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isUpdate = !!transferForm.id;
      const url = isUpdate ? `/api/transfers/${transferForm.id}` : '/api/transfers';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      });
      if (res.ok) {
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        fetchData();
        setShowTransferModal(false);
        setTransferForm({
          date: new Date().toISOString().split('T')[0],
          from_warehouse_id: '',
          to_warehouse_id: '',
          items: [{ product_id: '', quantity: 1 }],
          notes: ''
        });
      } else {
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting transfer:', error);
      setToast({ message: 'خطأ في الاتصال بالخادم', type: 'error' });
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isUpdate = !!stockAdjustmentForm.id;
      const url = isUpdate ? `/api/adjustments/${stockAdjustmentForm.id}` : '/api/adjustments';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockAdjustmentForm)
      });
      if (res.ok) {
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        fetchData();
        setShowAdjustmentModal(false);
        setStockAdjustmentForm({
          type: 'in',
          date: new Date().toISOString().split('T')[0],
          warehouse_id: '',
          reason: '',
          items: [{ product_id: '', quantity: 1 }],
          notes: ''
        });
      } else {
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting adjustment:', error);
      setToast({ message: 'خطأ في الاتصال بالخادم', type: 'error' });
    }
  };

  const [productModalTab, setProductModalTab] = useState('الأسعار');
  
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({ 
          name: '', 
          name_en: '',
          sku: '', 
          barcode: '',
          electronic_invoice_code: '',
          coding_type: 'GS1',
          is_assembly: false,
          is_service: false,
          has_expiry: false,
          has_serial: false,
          stop_sale: false,
          stop_purchase: false,
          concrete_type: 'normal',
          part_numbers: ['', '', '', '', '', ''],
          additional_statement: '',
          no_points: false,
          no_discount: false,
          for_rent: false,
          category: '', 
          categories: [],
          group_id: '',
          groups: [],
          unit: 'قطعة', 
          quantity: 0, 
          cost_price: 0, 
          sale_price: 0, 
          min_stock: 0, 
          warehouse_id: '',
          is_active: true
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isUpdate = !!scForm.id;
      const url = isUpdate ? `/api/suppliers-customers/${scForm.id}` : '/api/suppliers-customers';
      const method = isUpdate ? 'PUT' : 'POST';
      
      // Handle opening balance sign: Supplier = Credit (Negative), Customer = Debit (Positive)
      const openingBalance = Number(scForm.opening_balance || 0);
      const initialBalance = scForm.type === 'supplier' ? -Math.abs(openingBalance) : Math.abs(openingBalance);
      
      let finalBalance = isUpdate ? scForm.balance : initialBalance;
      
      if (isUpdate) {
        const originalParty = suppliersCustomers.find(sc => sc.id === scForm.id);
        if (originalParty) {
          const originalOpeningBalance = Number(originalParty.opening_balance || 0);
          const diff = initialBalance - originalOpeningBalance;
          finalBalance = Number(scForm.balance || 0) + diff;
        }
      }
      
      const submissionData = {
        ...scForm,
        opening_balance: initialBalance,
        balance: finalBalance
      };

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      if (res.ok) {
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        setShowSCModal(false);
        setSCForm({ type: 'customer', name: '', phone: '', email: '', balance: 0, opening_balance: 0, group_id: '' });
        fetchData();
      } else {
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'خطأ في الاتصال بالخادم', type: 'error' });
    }
  };

  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isUpdate = !!warehouseForm.id;
      const url = isUpdate ? `/api/warehouses/${warehouseForm.id}` : '/api/warehouses';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouseForm)
      });
      if (res.ok) {
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        setShowWarehouseModal(false);
        fetchData();
      } else {
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'خطأ في الاتصال بالخادم', type: 'error' });
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementForm)
      });
      if (res.ok) {
        setShowMovementModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA_e0h6d4ZpeKnu7-jCxKC7bM_dXxf_YfQ';
      const ai = new GoogleGenAI({ apiKey });
      
      // Context for AI
      const context = `
        You are a Financial Assistant for an ERP system. 
        Current stats: 
        Total Sales: ${stats.totalSales}
        Total Purchases: ${stats.totalPurchases}
        Cash Balance: ${stats.cashBalance}
        Inventory Value: ${stats.inventoryValue}
        
        The user is asking: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: context,
      });

      const text = response.text || "عذراً، لم أتمكن من معالجة طلبك.";
      setAiMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err) {
      console.error(err);
      setAiMessages(prev => [...prev, { role: 'model', text: "حدث خطأ أثناء الاتصال بالمساعد الذكي." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isUpdate = !!expenseForm.id;
      const url = isUpdate ? `/api/finance/${expenseForm.id}` : '/api/finance';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: expenseForm.type || 'expense',
          method: 'cash', // Default for now
          amount: expenseForm.amount,
          date: expenseForm.date,
          description: expenseForm.description,
          category_id: expenseForm.category_id,
          account_id: expenseForm.account_id
        })
      });
      if (res.ok) {
        setToast({ message: isUpdate ? 'تم تحديث السجل بنجاح' : 'تم حفظ السجل بنجاح', type: 'success' });
        setShowExpenseModal(false);
        fetchData();
      } else {
        const errData = await safeJson(res, { error: 'حدث خطأ' });
        setToast({ message: `خطأ في الحفظ: ${errData.error || 'حدث خطأ'}`, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDefinitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = `/api/${definitionForm.type.replace('_', '-')}`;
      const payload: any = { name: definitionForm.name, description: definitionForm.description };
      if (definitionForm.type === 'tax_types') payload.rate = definitionForm.rate;
      if (definitionForm.type === 'currencies' || definitionForm.type === 'cost_centers' || definitionForm.type === 'projects' || definitionForm.type === 'branches') {
        payload.code = definitionForm.code;
        if (definitionForm.type === 'currencies') payload.symbol = definitionForm.symbol;
      }
      if (definitionForm.type === 'models') {
        payload.brand_id = definitionForm.brand_id;
      }
      if (definitionForm.type === 'sales_reps' || definitionForm.type === 'shipping_cos') {
        payload.phone = definitionForm.phone;
        if (definitionForm.type === 'sales_reps') payload.commission_percent = definitionForm.commission_percent;
      }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowDefinitionModal(false);
        setDefinitionForm({ ...definitionForm, name: '', description: '', rate: 0, code: '', symbol: '', phone: '', commission_percent: 0 });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDefinitionDelete = async (type: string, id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const endpoint = `/api/${type.replace('_', '-')}/${id}`;
          const res = await fetch(endpoint, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteForm)
      });
      if (res.ok) {
        setShowQuoteModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCOASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isUpdate = !!coaForm.id;
      const url = isUpdate ? `/api/coa/${coaForm.id}` : '/api/chart-of-accounts';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coaForm)
      });
      if (res.ok) {
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        setShowCOAModal(false);
        fetchData();
      } else {
        const errData = await safeJson(res, { error: 'حدث خطأ' });
        setToast({ message: `خطأ في الحفظ: ${errData.error || 'حدث خطأ'}`, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isUpdate = !!bankAccountForm.id;
      const url = isUpdate ? `/api/bank-accounts/${bankAccountForm.id}` : '/api/bank-accounts';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankAccountForm)
      });
      if (res.ok) {
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        setShowBankAccountModal(false);
        fetchData();
      } else {
        const errData = await safeJson(res, { error: 'حدث خطأ' });
        setToast({ message: `خطأ في الحفظ: ${errData.error || 'حدث خطأ'}`, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBankAccount = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الحساب',
      message: 'هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleFinancialDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isUpdate = !!financialDocForm.id;
      const url = isUpdate ? `/api/transactions/${financialDocForm.id}` : '/api/transactions';
      const method = isUpdate ? 'PUT' : 'POST';
      
      // Map financial doc type to transaction type
      let mappedType = 'sale_payment';
      if (financialDocForm.type === 'payment') mappedType = 'purchase_payment';
      else if (financialDocForm.type === 'settlement') mappedType = 'settlement';
      else if (financialDocForm.type === 'check') mappedType = 'check';

      const submissionData = {
        ...financialDocForm,
        type: mappedType,
        items: [], // Financial docs don't have items
        payment_method: financialDocForm.account_id ? (bankAccounts.find(ba => ba.id === financialDocForm.account_id)?.type === 'bank' ? 'bank' : 'cash') : 'cash',
        document_number: financialDocForm.number
      };
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      if (res.ok) {
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        setShowFinancialDocModal(false);
        fetchData();
      } else {
        const errData = await safeJson(res, { error: 'حدث خطأ' });
        setToast({ message: `خطأ في الحفظ: ${errData.error || 'حدث خطأ'}`, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent, shouldClose = true) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log('Submitting transaction:', transactionForm);
      const url = editingTransaction ? `/api/transactions/${editingTransaction.id}` : '/api/transactions';
      const method = editingTransaction ? 'PUT' : 'POST';
      
      // Map payment_type to payment_method for backend compatibility
      const submissionData = {
        ...transactionForm,
        payment_method: transactionForm.payment_type === 'نقدي' ? 'cash' : 
                        transactionForm.payment_type === 'شيك' ? 'check' : 
                        transactionForm.payment_type === 'حوالة بنكية' ? 'bank' : 
                        transactionForm.payment_type === 'أجل' ? 'credit' : 'cash'
      };
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      if (res.ok) {
        console.log('Transaction saved successfully');
        setToast({ message: 'تم الحفظ بنجاح', type: 'success' });
        if (shouldClose) {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }
        setTransactionForm({
          type: 'sale',
          invoice_type: 'cash',
          payment_type: 'نقدي',
          document_number: '',
          party_id: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          warehouse_id: '',
          account_id: '',
          sales_rep_id: '',
          shipping_co_id: '',
          cost_center_id: '',
          currency_id: '',
          exchange_rate: 1,
          pricing_type: 'retail',
          items: [{ product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, tax_percent: Number(systemSettings.default_tax_percent || 14), tax_amount: 0, net_amount: 0 }],
          total_items_amount: 0,
          total_discount: 0,
          total_tax: 0,
          net_amount: 0,
          paid_amount: 0,
          remaining_amount: 0,
          transport_car_id: '',
          transport_driver_id: '',
          is_delivery: false,
          delivery_notes: '',
          notes: ''
        });
        fetchData();
        return true;
      } else {
        const errData = await safeJson(res, { error: 'حدث خطأ غير متوقع' });
        setToast({ message: `خطأ في الحفظ: ${errData.error || 'حدث خطأ غير متوقع'}`, type: 'error' });
        return false;
      }
    } catch (err) {
      console.error('Transaction submit error:', err);
      setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const totalDebit = journalForm.lines.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0);
    const totalCredit = journalForm.lines.reduce((sum: number, line: any) => sum + Number(line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setToast({ message: 'القيد غير متزن (إجمالي المدين يجب أن يساوي إجمالي الدائن)', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journalForm)
      });
      if (res.ok) {
        setToast({ message: 'تم حفظ القيد بنجاح', type: 'success' });
        setShowJournalModal(false);
        setJournalForm({
          date: new Date().toISOString().split('T')[0],
          description: '',
          lines: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }]
        });
        fetchData();
      } else {
        const errData = await safeJson(res, { error: 'خطأ في الحفظ' });
        setToast({ message: errData.error, type: 'error' });
      }
    } catch (err) {
      console.error('Journal submit error:', err);
      setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReport = () => {
    const reportContent = document.getElementById('report-content-to-print');
    if (!reportContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة التقرير');
      return;
    }

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>${activeReport}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 20px; color: #141414; background: white; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #141414; padding: 10px; text-align: right; font-size: 11px; }
            th { background-color: #f8f8f8; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #141414; padding-bottom: 15px; }
            .header h1 { margin: 0; font-size: 20px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; opacity: 0.7; }
            .footer { margin-top: 30px; text-align: center; font-size: 9px; opacity: 0.6; border-top: 1px solid #eee; padding-top: 15px; }
            .text-green-600 { color: #16a34a !important; }
            .text-red-600 { color: #dc2626 !important; }
            .font-bold { font-weight: 700; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${activeReport}</h1>
            <p>الفترة من ${reportFilters.startDate} إلى ${reportFilters.endDate}</p>
          </div>
          ${reportContent.innerHTML}
          <div class="footer">
            <p>تم استخراج هذا التقرير بتاريخ ${new Date().toLocaleString('ar-EG')}</p>
            <p>برنامج المحاسب الذكي - جميع الحقوق محفوظة</p>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getAccountStatementData = () => {
    const start = new Date(reportFilters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportFilters.endDate);
    end.setHours(23, 59, 59, 999);

    if (reportFilters.partyId) {
      const party = suppliersCustomers.find(sc => sc.id === reportFilters.partyId);
      if (!party) return { openingBalance: 0, transactions: [] };

      // If the party has a linked account, use journal entry lines for a more accurate statement
      if (party.account_id) {
        const linesBefore = journalEntryLines.filter(l => 
          l.account_id === party.account_id && 
          new Date(l.date) < start
        );

        const balanceBefore = linesBefore.reduce((sum, l) => {
          const debit = Number(l.debit || 0);
          const credit = Number(l.credit || 0);
          return sum + (debit - credit);
        }, Number(party.opening_balance || 0));

        const filteredLines = journalEntryLines
          .filter(l => 
            l.account_id === party.account_id && 
            new Date(l.date) >= start &&
            new Date(l.date) <= end
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let currentBalance = balanceBefore;
        const statementLines = filteredLines.map(l => {
          const debit = Number(l.debit || 0);
          const credit = Number(l.credit || 0);
          currentBalance += (debit - credit);
          return {
            ...l,
            displayAmount: debit > 0 ? debit : credit,
            isDebit: debit > 0,
            runningBalance: currentBalance,
            description: l.description || 'قيد يومية'
          };
        });

        return { openingBalance: balanceBefore, transactions: statementLines };
      }

      const initialBalance = Number(party.opening_balance || 0);
      const transactionsBefore = transactions.filter(t => 
        t.party_id === party.id && 
        new Date(t.date) < start
      );

      const balanceBefore = transactionsBefore.reduce((sum, t) => {
        const amount = Number(t.total_amount);
        const paid = Number(t.paid_amount || 0);
        const isDebit = ['sale', 'purchase_return', 'purchase_payment'].includes(t.type);
        
        if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(t.type)) {
          if (t.invoice_type === 'cash') {
            const paymentAmount = paid > 0 ? paid : amount;
            const effective = amount - paymentAmount;
            return sum + (isDebit ? effective : -effective);
          } else if (t.invoice_type === 'credit') {
            return sum + (isDebit ? amount : -amount);
          } else {
            const effective = amount - paid;
            return sum + (isDebit ? effective : -effective);
          }
        } else {
          return sum + (isDebit ? amount : -amount);
        }
      }, initialBalance);

      const filteredTransactions = transactions
        .filter(t => 
          t.party_id === party.id && 
          new Date(t.date) >= start &&
          new Date(t.date) <= end
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let currentBalance = balanceBefore;
      const statementLines: any[] = [];

      filteredTransactions.forEach(t => {
        const amount = Number(t.total_amount);
        const paid = Number(t.paid_amount || 0);
        const isDebit = ['sale', 'purchase_return', 'purchase_payment'].includes(t.type);
        
        // Calculate gross amount if not present
        const grossAmount = Number(t.total_items_amount || (t.items || []).reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0));
        const taxAmount = Number(t.tax_amount || 0);
        const discountAmount = Number(t.discount_amount || 0);

        if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(t.type)) {
          // Line 1: The invoice itself
          currentBalance += (isDebit ? amount : -amount);
          statementLines.push({
            ...t,
            displayAmount: amount,
            isDebit: isDebit,
            runningBalance: currentBalance,
            description: `${t.type === 'sale' ? 'فاتورة مبيعات' : t.type === 'purchase' ? 'فاتورة مشتريات' : t.type === 'sale_return' ? 'مرتجع مبيعات' : 'مرتجع مشتريات'} رقم ${t.document_number || t.id} (إجمالي: ${grossAmount.toFixed(2)}, ضريبة: ${taxAmount.toFixed(2)}, خصم: ${discountAmount.toFixed(2)})`
          });

          // Line 2: The payment if any
          if (t.invoice_type === 'cash') {
            const paymentAmount = paid > 0 ? paid : amount;
            currentBalance += (isDebit ? -paymentAmount : paymentAmount);
            statementLines.push({
              ...t,
              id: t.id + '_paid',
              displayAmount: paymentAmount,
              isDebit: !isDebit,
              runningBalance: currentBalance,
              description: `مدفوعة نقدي - فاتورة رقم ${t.document_number || t.id}`
            });
          } else if (paid > 0) {
            currentBalance += (isDebit ? -paid : paid);
            statementLines.push({
              ...t,
              id: t.id + '_paid',
              displayAmount: paid,
              isDebit: !isDebit,
              runningBalance: currentBalance,
              description: `مدفوع من فاتورة رقم ${t.document_number || t.id}`
            });
          }
        } else {
          currentBalance += (isDebit ? amount : -amount);
          statementLines.push({
            ...t,
            displayAmount: amount,
            isDebit: isDebit,
            runningBalance: currentBalance,
            description: t.type === 'sale_payment' ? 'سند قبض' : 
                         t.type === 'purchase_payment' ? 'سند صرف' : 'تسوية'
          });
        }
      });

      return { openingBalance: balanceBefore, transactions: statementLines };
    } else if (reportFilters.accountId) {
      const account = chartOfAccounts.find(acc => acc.id === reportFilters.accountId);
      if (!account) return { openingBalance: 0, transactions: [] };

      const linesBefore = journalEntryLines.filter(l => 
        l.account_id === account.id && 
        new Date(l.date) < start
      );

      const balanceBefore = linesBefore.reduce((sum, l) => {
        const debit = Number(l.debit || 0);
        const credit = Number(l.credit || 0);
        return sum + (debit - credit);
      }, 0);

      const filteredLines = journalEntryLines
        .filter(l => 
          l.account_id === account.id && 
          new Date(l.date) >= start &&
          new Date(l.date) <= end
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let currentBalance = balanceBefore;
      const statementLines = filteredLines.map(l => {
        const debit = Number(l.debit || 0);
        const credit = Number(l.credit || 0);
        currentBalance += (debit - credit);
        return {
          ...l,
          displayAmount: debit > 0 ? debit : credit,
          isDebit: debit > 0,
          runningBalance: currentBalance,
          description: l.description || 'قيد يومية'
        };
      });

      return { openingBalance: balanceBefore, transactions: statementLines };
    }

    return { openingBalance: 0, transactions: [] };
  };

  const getTaxReportData = () => {
    const start = new Date(reportFilters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportFilters.endDate);
    end.setHours(23, 59, 59, 999);

    const filteredTransactions = transactions.filter(t => 
      new Date(t.date) >= start && 
      new Date(t.date) <= end
    );

    const sales = filteredTransactions.filter(t => t.type === 'sale');
    const purchases = filteredTransactions.filter(t => t.type === 'purchase');
    const salesReturns = filteredTransactions.filter(t => t.type === 'sale_return');
    const purchaseReturns = filteredTransactions.filter(t => t.type === 'purchase_return');

    const totalSalesAmount = sales.reduce((sum, t) => sum + Number(t.total_items_amount || 0), 0) - salesReturns.reduce((sum, t) => sum + Number(t.total_items_amount || 0), 0);
    const totalOutputTax = sales.reduce((sum, t) => sum + Number(t.total_tax || 0), 0) - salesReturns.reduce((sum, t) => sum + Number(t.total_tax || 0), 0);
    
    const totalPurchasesAmount = purchases.reduce((sum, t) => sum + Number(t.total_items_amount || 0), 0) - purchaseReturns.reduce((sum, t) => sum + Number(t.total_items_amount || 0), 0);
    const totalInputTax = purchases.reduce((sum, t) => sum + Number(t.total_tax || 0), 0) - purchaseReturns.reduce((sum, t) => sum + Number(t.total_tax || 0), 0);

    return {
      totalSalesAmount,
      totalOutputTax,
      totalPurchasesAmount,
      totalInputTax,
      netTax: totalOutputTax - totalInputTax
    };
  };

  const getProductMovementData = () => {
    const product = products.find(p => p.id === reportFilters.productId);
    if (!product) return { openingStock: 0, movements: [] };

    const start = new Date(reportFilters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportFilters.endDate);
    end.setHours(23, 59, 59, 999);

    const initialStock = 0; 
    
    const txBefore = transactions.filter(t => 
      new Date(t.date) < start &&
      t.items && t.items.some(item => item.product_id === product.id)
    );

    const stockBefore = txBefore.reduce((sum, t) => {
      const item = t.items.find(i => i.product_id === product.id);
      if (!item) return sum;
      const isAddition = (t.type === 'purchase' || t.type === 'sale_return');
      return sum + (isAddition ? item.quantity : -item.quantity);
    }, initialStock);

    const filteredTx = transactions.filter(t => 
      new Date(t.date) >= start &&
      new Date(t.date) <= end &&
      t.items && t.items.some(item => item.product_id === product.id)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentStock = stockBefore;
    const movements = filteredTx.map(t => {
      const item = t.items.find(i => i.product_id === product.id);
      const isAddition = (t.type === 'purchase' || t.type === 'sale_return');
      currentStock += (isAddition ? item!.quantity : -item!.quantity);
      return {
        date: t.date,
        type: t.type,
        doc_num: t.document_number,
        party: suppliersCustomers.find(sc => sc.id === t.party_id)?.name || '-',
        in: isAddition ? item!.quantity : 0,
        out: !isAddition ? item!.quantity : 0,
        balance: currentStock
      };
    });

    return { openingStock: stockBefore, movements };
  };

  const getSalesReportData = () => {
    const start = new Date(reportFilters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportFilters.endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      const isTypeMatch = (t.type === 'sale' || t.type === 'sale_return');
      const isDateMatch = d >= start && d <= end;
      const isPartyMatch = !reportFilters.partyId || t.party_id === reportFilters.partyId;
      const isProductMatch = !reportFilters.productId || (t.items && t.items.some(item => item.product_id === reportFilters.productId));
      const isSalesRepMatch = !reportFilters.salesRepId || t.sales_rep_id === reportFilters.salesRepId;
      
      return isTypeMatch && isDateMatch && isPartyMatch && isProductMatch && isSalesRepMatch;
    });

    if (activeReport === 'تقرير مرتجعات المبيعات') {
      return filtered.filter(t => t.type === 'sale_return').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    return filtered.filter(t => t.type === 'sale').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleViewJournalEntry = (documentNumberOrId: string) => {
    setActiveTab('finance');
    setFinanceSubTab('journal');
    setSearchQuery(documentNumberOrId);
  };

  const handlePrintTransaction = (transaction: any) => {
    const party = suppliersCustomers.find(sc => sc.id === transaction.party_id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const grossAmount = (transaction.items || []).reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = Number(transaction.tax_amount || 0);
    const discountAmount = Number(transaction.discount_amount || 0);
    const netAmount = Number(transaction.total_amount || 0);

    const itemsHtml = (transaction.items || []).map((item: any) => {
      const product = products.find(p => p.id === item.product_id);
      return `
        <tr>
          <td style="border: 1px solid #eee; padding: 12px; text-align: right;">${product?.name || 'منتج غير معروف'}</td>
          <td style="border: 1px solid #eee; padding: 12px; text-align: center;">${item.quantity}</td>
          <td style="border: 1px solid #eee; padding: 12px; text-align: left;">${item.unit_price.toLocaleString()}</td>
          <td style="border: 1px solid #eee; padding: 12px; text-align: left;">${(item.quantity * item.unit_price).toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    const formattedDate = new Date(transaction.date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة رقم ${transaction.document_number || transaction.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #1a1a1a; font-size: 28px; }
            .header .invoice-type { background: #f8f9fa; padding: 10px 20px; border-radius: 8px; font-weight: bold; color: #444; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .info-section h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
            .info-box { background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
            .info-box p { margin: 5px 0; font-size: 15px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8f9fa; color: #555; font-weight: bold; text-align: right; padding: 12px; border-bottom: 2px solid #eee; }
            
            .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; }
            .notes-section { font-size: 14px; color: #666; }
            
            .totals-table { width: 100%; }
            .totals-table tr td { padding: 8px 0; border: none; }
            .totals-table tr.grand-total td { border-top: 2px solid #f0f0f0; padding-top: 15px; margin-top: 10px; font-size: 18px; font-weight: bold; color: #d32f2f; }
            
            .print-footer { margin-top: 60px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${systemSettings.app_name}</h1>
              <p style="margin: 5px 0; color: #666;">نظام المحاسبة الذكي</p>
            </div>
            <div class="invoice-type">
              فاتورة ${transaction.type === 'sale' ? 'مبيعات' : transaction.type === 'purchase' ? 'مشتريات' : transaction.type === 'sale_return' ? 'مرتجع مبيعات' : 'مرتجع مشتريات'}
            </div>
          </div>

          <div class="info-grid">
            <div class="info-section">
              <h3>بيانات الفاتورة</h3>
              <div class="info-box">
                <p><strong>رقم الفاتورة:</strong> ${transaction.document_number || transaction.id}</p>
                <p><strong>التاريخ:</strong> ${formattedDate}</p>
                <p><strong>طريقة الدفع:</strong> ${transaction.payment_method === 'cash' ? 'نقدي' : transaction.payment_method === 'credit' ? 'أجل' : 'أخرى'}</p>
              </div>
            </div>
            <div class="info-section">
              <h3>بيانات ${transaction.type.includes('sale') ? 'العميل' : 'المورد'}</h3>
              <div class="info-box">
                <p><strong>الاسم:</strong> ${party?.name || 'عميل نقدي'}</p>
                <p><strong>الهاتف:</strong> ${party?.phone || '-'}</p>
                <p><strong>العنوان:</strong> ${party?.address || '-'}</p>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40%;">البيان</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: left;">سعر الوحدة</th>
                <th style="text-align: left;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="footer-grid">
            <div class="notes-section">
              <p><strong>ملاحظات:</strong></p>
              <p>${transaction.notes || 'لا توجد ملاحظات'}</p>
            </div>
            <div>
              <table class="totals-table">
                <tr>
                  <td>الإجمالي قبل الضريبة:</td>
                  <td style="text-align: left;">${grossAmount.toLocaleString()} ج.م</td>
                </tr>
                <tr>
                  <td>الضريبة:</td>
                  <td style="text-align: left;">${taxAmount.toLocaleString()} ج.م</td>
                </tr>
                <tr>
                  <td>الخصم:</td>
                  <td style="text-align: left;">${discountAmount.toLocaleString()} ج.م</td>
                </tr>
                <tr class="grand-total">
                  <td>الصافي النهائي:</td>
                  <td style="text-align: left;">${netAmount.toLocaleString()} ج.م</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="print-footer">
            طبع بواسطة ${systemSettings.app_name} - ${new Date().toLocaleString('ar-EG')}
          </div>

          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print(); 
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEditFinance = (entry: any) => {
    // Determine which modal to open based on entry type or other properties
    // For now, let's assume it's a general finance entry or expense
    if (entry.type === 'expense') {
      setExpenseForm(entry);
      setShowExpenseModal(true);
    } else {
      // Handle other types if necessary
      console.log('Edit finance entry:', entry);
    }
  };

  const handleDeleteFinance = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف عملية مالية',
      message: 'هل أنت متأكد من حذف هذه العملية المالية؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/finance/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف عملية',
      message: 'هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            const errData = await safeJson(res, { error: 'حدث خطأ غير متوقع' });
            setToast({ message: `خطأ في الحذف: ${errData.error || 'حدث خطأ غير متوقع'}`, type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      ...transaction,
      total_amount: Number(transaction.total_amount || 0),
      tax_amount: Number(transaction.tax_amount || 0),
      discount_amount: Number(transaction.discount_amount || 0),
      discount_percent: Number(transaction.discount_percent || 0),
      paid_amount: Number(transaction.paid_amount || 0),
      due_amount: Number(transaction.due_amount || 0),
      date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: transaction.time || new Date().toLocaleTimeString('en-US', { hour12: false }),
      payment_type: transaction.payment_method === 'cash' ? 'نقدي' : 
                    transaction.payment_method === 'check' ? 'شيك' : 
                    transaction.payment_method === 'bank' ? 'حوالة بنكية' : 
                    transaction.payment_method === 'credit' ? 'أجل' : 'نقدي',
      items: (transaction.items || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        discount_percent: Number(item.discount_percent || 0),
        discount_amount: Number(item.discount_amount || 0),
        tax_percent: Number(item.tax_percent || 0),
        tax_amount: Number(item.tax_amount || 0),
        net_amount: Number(item.net_amount || 0),
        total: Number(item.total || 0)
      }))
    });
    if (transaction.items && transaction.items.length === 0) {
      setTransactionForm(prev => ({
        ...prev,
        items: [{ product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, tax_percent: Number(systemSettings.default_tax_percent || 14), tax_amount: 0, net_amount: 0 }]
      }));
    }
    setShowTransactionModal(true);
  };

  const handleEditTransfer = (transfer: any) => {
    setTransferForm(transfer);
    setShowTransferModal(true);
  };

  const handleDeleteTransfer = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف تحويل',
      message: 'هل أنت متأكد من حذف هذا التحويل؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/transfers/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditAdjustment = (adjustment: any) => {
    setStockAdjustmentForm(adjustment);
    setShowAdjustmentModal(true);
  };

  const handleDeleteAdjustment = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف تسوية',
      message: 'هل أنت متأكد من حذف هذه التسوية؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/adjustments/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditWarehouse = (warehouse: any) => {
    setWarehouseForm(warehouse);
    setShowWarehouseModal(true);
  };

  const handleDeleteWarehouse = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف مستودع',
      message: 'هل أنت متأكد من حذف هذا المستودع؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteFinancialDoc = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف مستند مالي',
      message: 'هل أنت متأكد من حذف هذا المستند؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/financial-docs/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteCOA = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف حساب',
      message: 'هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/coa/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setToast({ message: 'تم الحذف بنجاح', type: 'success' });
            fetchData();
          } else {
            setToast({ message: 'فشل الحذف', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'حدث خطأ أثناء الاتصال بالخادم', type: 'error' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveAndNew = async (e: React.FormEvent) => {
    const type = transactionForm.type;
    const success = await handleTransactionSubmit(e, false);
    if (success) {
      openNewTransaction(type);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-bg', systemSettings.bg_color);
    root.style.setProperty('--app-text', systemSettings.text_color);
    root.style.setProperty('--app-heading', systemSettings.heading_color);
    root.style.setProperty('--app-detail', systemSettings.detail_color);
    root.style.setProperty('--app-card-bg', systemSettings.card_bg);
    root.style.setProperty('--app-font', systemSettings.font_family);
  }, [systemSettings]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await safeJson(res));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const savedUser = localStorage.getItem('accounting_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      if (parsed.role === 'setup_admin') {
        setActiveTab('settings');
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'setup_admin' && dbStatus === 'connected') {
      fetchData();
    }
  }, [currentUser, dbStatus]);

  useEffect(() => {
    if (currentUser?.role === 'admin' && activeTab === 'settings') {
      fetchUsers();
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    const totalItemsAmount = transactionForm.items.reduce((sum: number, item: any) => sum + ((item.unit_price || 0) * (item.quantity || 0)), 0);
    const totalTax = transactionForm.items.reduce((sum: number, item: any) => sum + (item.tax_amount || 0), 0);
    const totalDiscount = transactionForm.items.reduce((sum: number, item: any) => sum + (item.discount_amount || 0), 0);
    const headerDiscountFromPercent = (totalItemsAmount * (transactionForm.discount_percent || 0)) / 100;
    const netAmount = totalItemsAmount + totalTax - totalDiscount - (transactionForm.discount_amount || 0) - headerDiscountFromPercent;
    
    let paidAmount = transactionForm.paid_amount || 0;
    if (transactionForm.invoice_type === 'cash') {
      paidAmount = netAmount;
    } else if (transactionForm.type === 'sale_return' || transactionForm.type === 'purchase_return') {
      // For returns, if not cash, paid amount should default to 0 unless manually changed
      // This prevents carrying over values from previous sales
      if (transactionForm.paid_amount === undefined || transactionForm.paid_amount === null || transactionForm.paid_amount === 0) {
        paidAmount = 0;
      }
    }
    const remainingAmount = netAmount - paidAmount;

    if (
      transactionForm.total_items_amount !== totalItemsAmount ||
      transactionForm.total_tax !== totalTax ||
      transactionForm.total_discount !== totalDiscount ||
      transactionForm.net_amount !== netAmount ||
      transactionForm.remaining_amount !== remainingAmount ||
      (transactionForm.invoice_type === 'cash' && transactionForm.paid_amount !== netAmount)
    ) {
      setTransactionForm(prev => ({
        ...prev,
        total_items_amount: totalItemsAmount,
        total_tax: totalTax,
        total_discount: totalDiscount,
        net_amount: netAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        due_amount: remainingAmount,
        total_amount: netAmount // Backend uses total_amount for net
      }));
    }
  }, [transactionForm.items, transactionForm.discount_amount, transactionForm.discount_percent, transactionForm.paid_amount, transactionForm.invoice_type]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (res.ok) {
        const user = await safeJson(res, null);
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('accounting_user', JSON.stringify(user));
          if (user.role === 'setup_admin') {
            setActiveTab('settings');
          }
        }
      } else {
        if (res.status === 404) {
          if (window.location.hostname.includes('vercel.app')) {
            setAuthError('خطأ 404: سيرفر الـ API والـ Backend غير مشغل على Vercel. يرجى استخدام الرابط الحقيقي للنظام من خلال Cloud Run لتفعيل قاعدة البيانات PostgreSQL.');
          } else {
            setAuthError('سيرفر قاعدة البيانات غير مستجيب (خطأ 404). الرجاء استخدام الرابط الأصلي للنظام.');
          }
        } else {
          const data = await safeJson(res, { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
          setAuthError(data.error);
        }
      }
    } catch (err) {
      if (window.location.hostname.includes('vercel.app')) {
        setAuthError('منصة Vercel لا تدعم تشغيل قاعدة بيانات وسيرفر Express متكاملين بشكل مباشر. يرجى الدخول من خلال رابط الاستضافة الأساسي على Cloud Run.');
      } else {
        setAuthError('حدث خطأ في الاتصال بالملف البرمجي للخادم.');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('accounting_user');
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');
    try {
      const res = await fetch('/api/settings/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activationKey })
      });
      if (res.ok) {
        setIsActivated(true);
      } else {
        const data = await safeJson(res, { error: 'كود التفعيل غير صحيح' });
        setActivationError(data.error);
      }
    } catch (err) {
      setActivationError('حدث خطأ في الاتصال');
    }
  };

  const handleSaveDbConnection = async () => {
    if (!dbConnectionString) return;
    setIsSavingDb(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/settings/db-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: dbConnectionString })
      });
      if (res.ok) {
        setSaveStatus('success');
        setDbStatus('connected');
        fetchData();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });
      if (res.ok) {
        // Settings saved successfully
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col lg:flex-row overflow-hidden" dir="rtl">
        {/* Left Side - Visual/Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#141414] items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]" />
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 space-y-8 max-w-md text-right"
          >
            <div className="w-20 h-20 bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center rounded-2xl shadow-2xl">
              <TrendingUp className="text-white" size={40} />
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-sans font-black text-white tracking-tighter leading-none">
                {(systemSettings.app_name || 'المحاسب الذكي').split(' ')[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-purple-400">{(systemSettings.app_name || 'المحاسب الذكي').split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-lg text-white/60 font-medium leading-relaxed">
                نظام محاسبي متكامل لإدارة المخزون، المبيعات، والحركة المالية بدقة واحترافية عالية.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-white font-bold text-xl">100%</p>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">دقة البيانات</p>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-white font-bold text-xl">24/7</p>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">دعم فني متواصل</p>
              </div>
            </div>
          </motion.div>
          
          {/* Decorative Elements */}
          <div className="absolute bottom-12 right-12 flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[#0A0A0A] overflow-y-auto lg:h-screen">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md space-y-8 py-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-sans font-bold text-white tracking-tight">تسجيل الدخول</h2>
              <p className="text-white/40 text-sm">أهلاً بك مجدداً، يرجى إدخال بياناتك للوصول إلى لوحة التحكم.</p>
            </div>

            {dbStatus !== 'connected' && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-right" dir="rtl">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Database size={15} className="text-amber-500 shrink-0" />
                  <span>تنبيه: قاعدة البيانات غير متصلة</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  النظام غير متصل بقاعدة البيانات حالياً. يرجى تسجيل الدخول باستخدام حساب تهيئة النظام لضبط إعدادات الاتصال والربط وبدء العمل.
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mr-1">اسم المستخدم</label>
                  <div className="relative group">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="أدخل اسم المستخدم"
                      className="w-full p-4 pr-12 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:bg-white/10 outline-none text-white text-sm transition-all"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mr-1">كلمة المرور</label>
                  <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full p-4 pr-12 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:bg-white/10 outline-none text-white text-sm transition-all"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  {authError}
                </motion.div>
              )}

              <button className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-blue-400 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group">
                <span>دخول للنظام</span>
                <ArrowRight size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="pt-8 border-t border-white/5 flex justify-between items-center">
              <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">المحاسب الذكي v2.0</p>
              <div className="flex gap-4">
                <a href="#" className="text-[10px] text-white/40 hover:text-white transition-colors font-bold uppercase">المساعدة</a>
                <a href="#" className="text-[10px] text-white/40 hover:text-white transition-colors font-bold uppercase">الخصوصية</a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isActivated === false) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-white/10 p-12 w-full max-w-3xl rounded-3xl shadow-2xl text-center space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-blue-500 to-purple-500" />
          
          <div className="space-y-6 relative z-10">
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck size={40} className="text-orange-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-sans font-black text-white tracking-tighter uppercase">تفعيل النظام</h2>
              <p className="text-white/40 text-lg max-w-lg mx-auto leading-relaxed">
                يرجى إدخال مفتاح التفعيل الخاص بك للمتابعة واستخدام كافة ميزات النظام المحاسبي المتطور.
              </p>
            </div>
          </div>

          <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto relative z-10">
            <input 
              type="text" 
              placeholder="أدخل مفتاح التفعيل هنا..."
              className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none text-white text-center font-mono tracking-widest"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value)}
            />
            <button className="px-10 py-4 bg-white text-black font-black rounded-xl hover:bg-blue-500 hover:text-white transition-all duration-300 whitespace-nowrap">
              تفعيل الآن
            </button>
          </form>
          
          {activationError && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 font-bold"
            >
              {activationError}
            </motion.p>
          )}
          
          <div className="pt-10 border-t border-white/5 space-y-4 relative z-10">
            <p className="text-xs text-white/30 uppercase font-bold tracking-widest">للحصول على مفتاح التفعيل، يرجى التواصل مع الدعم الفني المعتمد</p>
            <button 
              onClick={handleLogout} 
              className="text-xs font-bold text-white/50 hover:text-white underline transition-colors"
            >
              تسجيل الخروج والعودة
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex overflow-hidden" dir="rtl">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 0,
          x: (typeof window !== 'undefined' && window.innerWidth < 1024) ? (isSidebarOpen ? 0 : 280) : 0
        }}
        className={cn(
          "bg-[#141414] text-white flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-all duration-300 shadow-2xl lg:shadow-none",
          !isSidebarOpen && "lg:w-0"
        )}
      >
        <div className="p-6 flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-3 mb-10 shrink-0">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl shadow-lg">
              <TrendingUp className="text-[#141414]" size={24} />
            </div>
            <h1 className="font-sans font-black text-xl tracking-tighter uppercase text-white">{systemSettings.app_name}</h1>
          </div>

          <nav className="space-y-1 overflow-y-auto pr-1 custom-scrollbar-dark flex-1 min-h-0">
            {currentUser?.role === 'setup_admin' ? (
              <SidebarItem icon={Settings} label="إعدادات الاتصال والربط" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            ) : (
              <>
                <SidebarItem icon={LayoutDashboard} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                
                <CollapsibleSidebarItem 
                  icon={Package} 
                  label="إدارة المخزون" 
                  isOpen={openSections.inventory_mgmt} 
                  onToggle={() => toggleSection('inventory_mgmt')}
                >
                  <SidebarItem icon={Package} label="الأصناف والمنتجات" active={activeTab === 'inventory_mgmt' && inventoryMgmtSubTab === 'products'} onClick={() => { setActiveTab('inventory_mgmt'); setInventoryMgmtSubTab('products'); }} />
                  <SidebarItem icon={Settings} label="الفئات" active={activeTab === 'inventory_mgmt' && inventoryMgmtSubTab === 'categories'} onClick={() => { setActiveTab('inventory_mgmt'); setInventoryMgmtSubTab('categories'); }} />
                  <SidebarItem icon={TrendingUp} label="المجموعات" active={activeTab === 'inventory_mgmt' && inventoryMgmtSubTab === 'groups'} onClick={() => { setActiveTab('inventory_mgmt'); setInventoryMgmtSubTab('groups'); }} />
                  <SidebarItem icon={Clock} label="الوحدات" active={activeTab === 'inventory_mgmt' && inventoryMgmtSubTab === 'units'} onClick={() => { setActiveTab('inventory_mgmt'); setInventoryMgmtSubTab('units'); }} />
                  <SidebarItem icon={ShieldCheck} label="الماركات" active={activeTab === 'inventory_mgmt' && inventoryMgmtSubTab === 'brands'} onClick={() => { setActiveTab('inventory_mgmt'); setInventoryMgmtSubTab('brands'); }} />
                  <SidebarItem icon={Activity} label="الموديلات" active={activeTab === 'inventory_mgmt' && inventoryMgmtSubTab === 'models'} onClick={() => { setActiveTab('inventory_mgmt'); setInventoryMgmtSubTab('models'); }} />
                </CollapsibleSidebarItem>

                <CollapsibleSidebarItem 
                  icon={Clock} 
                  label="حركة المخزون" 
                  isOpen={openSections.stock_movements} 
                  onToggle={() => toggleSection('stock_movements')}
                >
                  <SidebarItem icon={FileText} label="سجل الحركات" active={activeTab === 'stock_movements' && stockMovementsSubTab === 'log'} onClick={() => { setActiveTab('stock_movements'); setStockMovementsSubTab('log'); }} />
                  <SidebarItem icon={ArrowRightLeft} label="التحويلات" active={activeTab === 'stock_movements' && stockMovementsSubTab === 'transfers'} onClick={() => { setActiveTab('stock_movements'); setStockMovementsSubTab('transfers'); }} />
                  <SidebarItem icon={ShieldCheck} label="المستودعات" active={activeTab === 'stock_movements' && stockMovementsSubTab === 'warehouses'} onClick={() => { setActiveTab('stock_movements'); setStockMovementsSubTab('warehouses'); }} />
                  <SidebarItem icon={TrendingUp} label="التسويات" active={activeTab === 'stock_movements' && stockMovementsSubTab === 'adjustments'} onClick={() => { setActiveTab('stock_movements'); setStockMovementsSubTab('adjustments'); }} />
                </CollapsibleSidebarItem>

                <CollapsibleSidebarItem 
                  icon={ShoppingCart} 
                  label="المبيعات" 
                  isOpen={openSections.sales} 
                  onToggle={() => toggleSection('sales')}
                >
                  <SidebarItem icon={ShoppingCart} label="فواتير المبيعات" active={activeTab === 'sales' && salesSubTab === 'invoices'} onClick={() => { setActiveTab('sales'); setSalesSubTab('invoices'); }} />
                  <SidebarItem icon={RotateCcw} label="مردودات المبيعات" active={activeTab === 'sales' && salesSubTab === 'returns'} onClick={() => { setActiveTab('sales'); setSalesSubTab('returns'); }} />
                  <SidebarItem icon={FileText} label="عروض الأسعار" active={activeTab === 'sales' && salesSubTab === 'quotes'} onClick={() => { setActiveTab('sales'); setSalesSubTab('quotes'); }} />
                  <SidebarItem icon={User} label="العملاء" active={activeTab === 'sales' && salesSubTab === 'parties'} onClick={() => { setActiveTab('sales'); setSalesSubTab('parties'); }} />
                </CollapsibleSidebarItem>

                <CollapsibleSidebarItem 
                  icon={TrendingDown} 
                  label="المشتريات" 
                  isOpen={openSections.purchase} 
                  onToggle={() => toggleSection('purchase')}
                >
                  <SidebarItem icon={TrendingDown} label="فواتير المشتريات" active={activeTab === 'purchase' && purchaseSubTab === 'invoices'} onClick={() => { setActiveTab('purchase'); setPurchaseSubTab('invoices'); }} />
                  <SidebarItem icon={RotateCcw} label="مردودات المشتريات" active={activeTab === 'purchase' && purchaseSubTab === 'returns'} onClick={() => { setActiveTab('purchase'); setPurchaseSubTab('returns'); }} />
                  <SidebarItem icon={Users} label="الموردين" active={activeTab === 'purchase' && purchaseSubTab === 'suppliers'} onClick={() => { setActiveTab('purchase'); setPurchaseSubTab('suppliers'); }} />
                </CollapsibleSidebarItem>

                <CollapsibleSidebarItem 
                  icon={Wallet} 
                  label="الحسابات والمالية" 
                  isOpen={openSections.finance} 
                  onToggle={() => toggleSection('finance')}
                >
                  <SidebarItem icon={Wallet} label="الحركة المالية" active={activeTab === 'finance' && financeSubTab === 'cash'} onClick={() => { setActiveTab('finance'); setFinanceSubTab('cash'); }} />
                  <SidebarItem icon={ShieldCheck} label="الصناديق والبنوك" active={activeTab === 'finance' && financeSubTab === 'accounts'} onClick={() => { setActiveTab('finance'); setFinanceSubTab('accounts'); }} />
                  <SidebarItem icon={TrendingUp} label="شجرة الحسابات" active={activeTab === 'finance' && financeSubTab === 'coa'} onClick={() => { setActiveTab('finance'); setFinanceSubTab('coa'); }} />
                  <SidebarItem icon={ArrowDownLeft} label="المصاريف" active={activeTab === 'finance' && financeSubTab === 'expenses'} onClick={() => { setActiveTab('finance'); setFinanceSubTab('expenses'); }} />
                  <SidebarItem icon={ClipboardList} label="قيود اليومية" active={activeTab === 'finance' && financeSubTab === 'journal'} onClick={() => { setActiveTab('finance'); setFinanceSubTab('journal'); }} />
                </CollapsibleSidebarItem>

                <SidebarItem icon={FileText} label="التقارير" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                <SidebarItem icon={Settings} label="التعريفات" active={activeTab === 'definitions'} onClick={() => setActiveTab('definitions')} />
              </>
            )}
          </nav>
        </div>

        {currentUser?.role !== 'setup_admin' && (
          <div className="p-4 border-t border-[var(--app-text)]/10 mt-auto">
            <SidebarItem icon={Settings} label="الإعدادات" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        )}
      </motion.aside>

      <main className="flex-1 flex flex-col h-screen relative bg-[#F5F5F3] overflow-hidden">
        <AnimatePresence>
          {showProductModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-card-bg)] w-full max-w-5xl p-6 border border-[#141414]/10 shadow-2xl max-h-[95vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-sans font-bold">{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
                  <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  {/* Header Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#141414]/5 p-4 rounded-sm">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الكود</label>
                      <input type="text" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                        value={productForm.sku || ''} onChange={e => setProductForm({...productForm, sku: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الكود 2</label>
                      <input type="text" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                        value={productForm.code2 || ''} onChange={e => setProductForm({...productForm, code2: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الباركود</label>
                      <input type="text" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                        value={productForm.barcode || ''} onChange={e => setProductForm({...productForm, barcode: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">كود الفاتورة الإلكترونية</label>
                      <input type="text" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                        value={productForm.electronic_invoice_code || ''} onChange={e => setProductForm({...productForm, electronic_invoice_code: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">نوع التكويد</label>
                      <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                        value={productForm.coding_type || 'GS1'} onChange={e => setProductForm({...productForm, coding_type: e.target.value})}
                      >
                        <option value="GS1">GS1</option>
                        <option value="EGS">EGS</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">اسم الصنف</label>
                      <input type="text" required className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={productForm.name || ''} onChange={e => setProductForm({...productForm, name: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        <input type="checkbox" checked={productForm.is_assembly} onChange={e => setProductForm({...productForm, is_assembly: e.target.checked})} />
                        صنف تجميعي
                      </label>
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        <input type="checkbox" checked={productForm.is_service} onChange={e => setProductForm({...productForm, is_service: e.target.checked})} />
                        صنف بدون رصيد
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الاسم بالإنجليزي</label>
                      <input type="text" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-sm font-sans" 
                        value={productForm.name_en || ''} onChange={e => setProductForm({...productForm, name_en: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الاسم في كشف الجملة</label>
                      <input type="text" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-sm" />
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        <input type="checkbox" checked={productForm.has_expiry} onChange={e => setProductForm({...productForm, has_expiry: e.target.checked})} />
                        بتواريخ صلاحية
                      </label>
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        <input type="checkbox" checked={productForm.has_serial} onChange={e => setProductForm({...productForm, has_serial: e.target.checked})} />
                        له أرقام مسلسلة
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">نوع الخرسانة</label>
                      <div className="flex gap-4 p-2 bg-[#141414]/5 rounded-sm">
                        <label className="flex items-center gap-1 text-xs">
                          <input type="radio" name="concrete_type" checked={productForm.concrete_type === 'normal'} onChange={() => setProductForm({...productForm, concrete_type: 'normal'})} /> عادية
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input type="radio" name="concrete_type" checked={productForm.concrete_type === 'reinforced'} onChange={() => setProductForm({...productForm, concrete_type: 'reinforced'})} /> مسلحة
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        <input type="checkbox" checked={productForm.stop_sale} onChange={e => setProductForm({...productForm, stop_sale: e.target.checked})} />
                        وقف بيع
                      </label>
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        <input type="checkbox" checked={productForm.stop_purchase} onChange={e => setProductForm({...productForm, stop_purchase: e.target.checked})} />
                        وقف شراء
                      </label>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">بيان إضافي</label>
                      <input type="text" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={productForm.additional_statement || ''} onChange={e => setProductForm({...productForm, additional_statement: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_taxable_basic" className="w-4 h-4" checked={productForm.is_taxable !== false} onChange={e => setProductForm({...productForm, is_taxable: e.target.checked})} />
                        <label htmlFor="is_taxable_basic" className="text-[10px] font-bold uppercase opacity-50 text-blue-600">خاضع للضريبة</label>
                      </div>
                      {productForm.is_taxable !== false && (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase opacity-40">نسبة الضريبة المطبقة</span>
                          <span className="text-xs font-mono font-bold text-blue-600">{systemSettings.default_tax_percent || 14}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Part Numbers */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <div key={n} className="space-y-1">
                        <label className="text-[8px] font-bold uppercase opacity-50">PartNo{n}</label>
                        <input type="text" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" 
                          value={productForm.part_numbers?.[n-1] || ''} 
                          onChange={e => {
                            const newParts = [...(productForm.part_numbers || ['', '', '', '', '', ''])];
                            newParts[n-1] = e.target.value;
                            setProductForm({...productForm, part_numbers: newParts});
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Tabs Area */}
                  <div className="border border-[#141414]/10 rounded-sm overflow-hidden">
                    <div className="flex bg-[#141414]/5 border-bottom border-[#141414]/10">
                      {['الأسعار', 'أسعار إضافية', 'التصنيفات', 'المجموعات', 'بيانات أخرى', 'الأرصدة'].map(tab => (
                        <button 
                          key={tab} 
                          type="button" 
                          onClick={() => setProductModalTab(tab)}
                          className={cn(
                            "px-4 py-2 text-[10px] font-bold uppercase border-r border-[#141414]/10 transition-colors",
                            productModalTab === tab ? "bg-white border-b-2 border-b-[#141414]" : "hover:bg-white"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 space-y-4 min-h-[200px]">
                      {productModalTab === 'الأسعار' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">آخر سعر شراء</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={productForm.last_purchase_price || 0} onChange={e => setProductForm({...productForm, last_purchase_price: Number(e.target.value)})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">سعر البيع</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={productForm.sale_price || 0} onChange={e => setProductForm({...productForm, sale_price: Number(e.target.value)})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">سعر الجملة</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={productForm.wholesale_price || 0} onChange={e => setProductForm({...productForm, wholesale_price: Number(e.target.value)})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">نصف جملة</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={productForm.half_wholesale_price || 0} onChange={e => setProductForm({...productForm, half_wholesale_price: Number(e.target.value)})} />
                          </div>
                        </div>
                      )}

                      {productModalTab === 'التصنيفات' && (
                        <div className="space-y-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">الفئات (اختر واحدة أو أكثر)</label>
                            <div className="flex flex-wrap gap-2 p-2 bg-[#141414]/5 rounded-sm min-h-[40px]">
                              {productCategories.map(cat => (
                                <label key={cat.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-[10px] border border-[#141414]/10 cursor-pointer hover:bg-blue-50">
                                  <input type="checkbox" 
                                    checked={productForm.categories?.includes(cat.name)}
                                    onChange={e => {
                                      const current = productForm.categories || [];
                                      const next = e.target.checked ? [...current, cat.name] : current.filter(c => c !== cat.name);
                                      setProductForm({...productForm, categories: next, category: next[0] || ''});
                                    }}
                                  />
                                  {cat.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {productModalTab === 'المجموعات' && (
                        <div className="space-y-6">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold uppercase opacity-50">المجموعات (اختر واحدة أو أكثر)</label>
                              <button 
                                type="button"
                                onClick={() => { setDefinitionForm({ type: 'product_groups', name: '', description: '' }); setShowDefinitionModal(true); }}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                + مجموعة جديدة
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-2 bg-[#141414]/5 rounded-sm min-h-[40px]">
                              {productGroups.map(group => (
                                <label key={group.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-[10px] border border-[#141414]/10 cursor-pointer hover:bg-blue-50">
                                  <input type="checkbox" 
                                    checked={productForm.groups?.includes(group.name)}
                                    onChange={e => {
                                      const current = productForm.groups || [];
                                      const next = e.target.checked ? [...current, group.name] : current.filter(g => g !== group.name);
                                      setProductForm({...productForm, groups: next, group_id: next[0] || ''});
                                    }}
                                  />
                                  {group.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {productModalTab === 'بيانات أخرى' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">الماركة</label>
                            <select className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs" value={productForm.brand_id || ''} onChange={e => setProductForm({...productForm, brand_id: e.target.value})}>
                              <option value="">اختر الماركة</option>
                              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">الموديل</label>
                            <select className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs" value={productForm.model_id || ''} onChange={e => setProductForm({...productForm, model_id: e.target.value})}>
                              <option value="">اختر الموديل</option>
                              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">بلد المنشأ</label>
                            <input type="text" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs" value={productForm.origin || ''} onChange={e => setProductForm({...productForm, origin: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">الضمان</label>
                            <input type="text" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs" value={productForm.warranty || ''} onChange={e => setProductForm({...productForm, warranty: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">الباركود</label>
                            <input type="text" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={productForm.barcode || ''} onChange={e => setProductForm({...productForm, barcode: e.target.value})} />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" id="is_active" className="w-4 h-4" checked={productForm.is_active !== false} onChange={e => setProductForm({...productForm, is_active: e.target.checked})} />
                            <label htmlFor="is_active" className="text-[10px] font-bold uppercase opacity-50">نشط</label>
                          </div>
                        </div>
                      )}

                      {productModalTab === 'الأرصدة' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">المستودع الافتراضي</label>
                            <select className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs" value={productForm.warehouse_id || ''} onChange={e => setProductForm({...productForm, warehouse_id: e.target.value})}>
                              <option value="">اختر المستودع</option>
                              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">الكمية الحالية</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={productForm.quantity || 0} onChange={e => setProductForm({...productForm, quantity: Number(e.target.value)})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">الحد الأدنى</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={productForm.min_stock || 0} onChange={e => setProductForm({...productForm, min_stock: Number(e.target.value)})} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-[#141414]/10">
                    <div className="flex gap-2">
                      <button type="button" className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-sm uppercase">استيراد من إكسيل</button>
                      <button type="button" className="px-4 py-2 bg-gray-600 text-white text-[10px] font-bold rounded-sm uppercase">تحديث الأسعار</button>
                    </div>
                    <button type="submit" className="px-8 py-3 bg-[#141414] text-[#E4E3E0] font-bold rounded-sm hover:bg-[#141414]/90 transition-colors">
                      {editingProduct ? 'تحديث بيانات الصنف' : 'حفظ الصنف الجديد'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showTransferModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--app-card-bg)] w-full max-w-4xl p-8 border border-[#141414]/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-sans font-bold">تحويل مخزني جديد</h3>
                  <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setShowTransferModal(false); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">التاريخ</label>
                      <input type="date" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" value={transferForm.date || ''} onChange={e => setTransferForm({...transferForm, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">من مخزن</label>
                      <select className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" value={transferForm.from_warehouse_id || ''} onChange={e => setTransferForm({...transferForm, from_warehouse_id: e.target.value})}>
                        <option value="">اختر المخزن</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">إلى مخزن</label>
                      <select className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" value={transferForm.to_warehouse_id || ''} onChange={e => setTransferForm({...transferForm, to_warehouse_id: e.target.value})}>
                        <option value="">اختر المخزن</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold opacity-50 uppercase">الأصناف المحولة</h4>
                      <button type="button" onClick={() => setTransferForm({...transferForm, items: [...transferForm.items, { product_id: '', quantity: 1 }]})} className="text-xs font-bold flex items-center gap-1 hover:underline"><Plus size={14} /> إضافة صنف</button>
                    </div>
                    <div className="space-y-2">
                      {transferForm.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-8 space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-30">الصنف</label>
                            <select className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs" value={item.product_id || ''} onChange={e => {
                              const newItems = [...transferForm.items];
                              newItems[idx].product_id = e.target.value;
                              setTransferForm({...transferForm, items: newItems});
                            }}>
                              <option value="">اختر الصنف</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
                            </select>
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-30">الكمية</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={item.quantity || 0} onChange={e => {
                              const newItems = [...transferForm.items];
                              newItems[idx].quantity = Number(e.target.value);
                              setTransferForm({...transferForm, items: newItems});
                            }} />
                          </div>
                          <div className="col-span-1">
                            <button type="button" onClick={() => {
                              const newItems = transferForm.items.filter((_, i) => i !== idx);
                              setTransferForm({...transferForm, items: newItems});
                            }} className="p-2 text-red-500 hover:bg-red-50 rounded-sm"><X size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">ملاحظات</label>
                    <textarea className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm h-20" value={transferForm.notes || ''} onChange={e => setTransferForm({...transferForm, notes: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold">حفظ التحويل المخزني</button>
                </form>
              </motion.div>
            </div>
          )}

          {showAdjustmentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--app-card-bg)] w-full max-w-4xl p-8 border border-[#141414]/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-sans font-bold">{stockAdjustmentForm.type === 'in' ? 'إذن استلام مخزني' : 'إذن صرف مخزني'}</h3>
                  <button onClick={() => setShowAdjustmentModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setShowAdjustmentModal(false); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">التاريخ</label>
                      <input type="date" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" value={stockAdjustmentForm.date || ''} onChange={e => setStockAdjustmentForm({...stockAdjustmentForm, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">المخزن</label>
                      <select className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" value={stockAdjustmentForm.warehouse_id || ''} onChange={e => setStockAdjustmentForm({...stockAdjustmentForm, warehouse_id: e.target.value})}>
                        <option value="">اختر المخزن</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">السبب / المرجع</label>
                      <input type="text" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" value={stockAdjustmentForm.reason || ''} onChange={e => setStockAdjustmentForm({...stockAdjustmentForm, reason: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold opacity-50 uppercase">الأصناف</h4>
                      <button type="button" onClick={() => setStockAdjustmentForm({...stockAdjustmentForm, items: [...stockAdjustmentForm.items, { product_id: '', quantity: 1 }]})} className="text-xs font-bold flex items-center gap-1 hover:underline"><Plus size={14} /> إضافة صنف</button>
                    </div>
                    <div className="space-y-2">
                      {stockAdjustmentForm.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-8 space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-30">الصنف</label>
                            <select className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs" value={item.product_id || ''} onChange={e => {
                              const newItems = [...stockAdjustmentForm.items];
                              newItems[idx].product_id = e.target.value;
                              setStockAdjustmentForm({...stockAdjustmentForm, items: newItems});
                            }}>
                              <option value="">اختر الصنف</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
                            </select>
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-30">الكمية</label>
                            <input type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs font-mono" value={item.quantity || 0} onChange={e => {
                              const newItems = [...stockAdjustmentForm.items];
                              newItems[idx].quantity = Number(e.target.value);
                              setStockAdjustmentForm({...stockAdjustmentForm, items: newItems});
                            }} />
                          </div>
                          <div className="col-span-1">
                            <button type="button" onClick={() => {
                              const newItems = stockAdjustmentForm.items.filter((_, i) => i !== idx);
                              setStockAdjustmentForm({...stockAdjustmentForm, items: newItems});
                            }} className="p-2 text-red-500 hover:bg-red-50 rounded-sm"><X size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">ملاحظات</label>
                    <textarea className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm h-20" value={stockAdjustmentForm.notes || ''} onChange={e => setStockAdjustmentForm({...stockAdjustmentForm, notes: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold">حفظ المستند</button>
                </form>
              </motion.div>
            </div>
          )}
          {showSCModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-card-bg)] w-full max-w-md p-8 border border-[#141414]/10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-sans font-bold">إضافة مورد / عميل</h3>
                  <button onClick={() => setShowSCModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={handleSCSubmit} className="space-y-4">
                  <div className="flex gap-2 p-1 bg-[#141414]/5 rounded-sm">
                    <button 
                      type="button"
                      onClick={() => setSCForm({...scForm, type: 'customer'})}
                      className={cn("flex-1 py-2 text-xs font-bold transition-all", scForm.type === 'customer' ? "bg-white shadow-sm" : "opacity-50")}
                    >عميل</button>
                    <button 
                      type="button"
                      onClick={() => setSCForm({...scForm, type: 'supplier'})}
                      className={cn("flex-1 py-2 text-xs font-bold transition-all", scForm.type === 'supplier' ? "bg-white shadow-sm" : "opacity-50")}
                    >مورد</button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الاسم</label>
                    <input 
                      type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={scForm.name || ''} onChange={e => setSCForm({...scForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">رقم الهاتف</label>
                    <input 
                      type="text" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={scForm.phone || ''} onChange={e => setSCForm({...scForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">المجموعة</label>
                    <select 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={scForm.group_id || ''} onChange={e => setSCForm({...scForm, group_id: e.target.value})}
                    >
                      <option value="">اختر المجموعة</option>
                      {scForm.type === 'customer' 
                        ? customerGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                        : supplierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                      }
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الحساب المرتبط</label>
                    <select 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={scForm.account_id || ''} onChange={e => setSCForm({...scForm, account_id: e.target.value})}
                    >
                      <option value="">اختر الحساب</option>
                      {chartOfAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الرصيد الافتتاحي</label>
                    <input 
                      type="number" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={Math.abs(scForm.opening_balance || 0)} onChange={e => setSCForm({...scForm, opening_balance: Number(e.target.value)})}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4">حفظ البيانات</button>
                </form>
              </motion.div>
            </div>
          )}

          {showTransactionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#E4E3E0] w-full max-w-7xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
              >
                <div className="bg-[#141414] p-4 text-[#E4E3E0] flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-sans font-bold tracking-tight">
                      {transactionForm.type === 'sale' ? 'فاتورة مبيعات' : 
                       transactionForm.type === 'purchase' ? 'فاتورة مشتريات' : 
                       transactionForm.type === 'sale_return' ? 'مرتجع مبيعات' : 'مرتجع مشتريات'}
                    </h3>
                    <span className="px-2 py-0.5 bg-white/10 text-[10px] font-bold uppercase rounded-sm">
                      {transactionForm.type === 'sale' ? 'Sales Invoice' : 'Purchase Invoice'}
                    </span>
                  </div>
                  <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleTransactionSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Header Section */}
                  <div className="bg-white/50 p-4 rounded-sm space-y-4 border border-[#141414]/5">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">رقم المستند</label>
                        <input type="text" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                          value={transactionForm.document_number || ''} onChange={e => setTransactionForm({...transactionForm, document_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">الفرع</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.branch_id || ''} onChange={e => setTransactionForm({...transactionForm, branch_id: e.target.value})}
                        >
                          <option value="">اختر الفرع</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">المشروع</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.project_id || ''} onChange={e => setTransactionForm({...transactionForm, project_id: e.target.value})}
                        >
                          <option value="">اختر المشروع</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">التاريخ</label>
                        <input type="date" required className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                          value={transactionForm.date || ''} onChange={e => setTransactionForm({...transactionForm, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">الوقت</label>
                        <input type="time" step="1" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                          value={transactionForm.time || ''} onChange={e => setTransactionForm({...transactionForm, time: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">حساب الصندوق/الفيزا</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.account_id || ''} onChange={e => setTransactionForm({...transactionForm, account_id: e.target.value})}
                        >
                          <option value="">اختر الحساب</option>
                          {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">نوع الفاتورة</label>
                        <div className="flex gap-2 p-1 bg-white rounded-sm">
                          {['نقدي', 'أجل', 'فيزا'].map(type => (
                            <button key={type} type="button" className={cn(
                              "flex-1 py-1 text-[10px] font-bold rounded-sm transition-colors",
                              transactionForm.payment_type === type ? "bg-[#141414] text-white" : "hover:bg-[#141414]/5"
                            )} onClick={() => {
                              const invType = type === 'أجل' ? 'credit' : 'cash';
                              let accId = transactionForm.account_id;
                              if (type === 'نقدي') accId = systemSettings.default_cash_account_id || accId;
                              if (type === 'فيزا') accId = systemSettings.default_bank_account_id || accId;
                              setTransactionForm({...transactionForm, payment_type: type, invoice_type: invType, account_id: accId});
                            }}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">التسعير</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.pricing_type || 'retail'} onChange={e => setTransactionForm({...transactionForm, pricing_type: e.target.value})}
                        >
                          <option value="retail">قطاعي</option>
                          <option value="wholesale">جملة</option>
                          <option value="half_wholesale">نصف جملة</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">
                          {transactionForm.type === 'sale' || transactionForm.type === 'sale_return' ? 'العميل' : 'المورد'}
                        </label>
                        <select required className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.party_id || ''} onChange={e => setTransactionForm({...transactionForm, party_id: e.target.value})}
                        >
                          <option value="">اختر {transactionForm.type === 'sale' || transactionForm.type === 'sale_return' ? 'العميل' : 'المورد'}</option>
                          {suppliersCustomers.filter(sc => 
                            (transactionForm.type === 'sale' || transactionForm.type === 'sale_return') ? sc.type === 'customer' : sc.type === 'supplier'
                          ).map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">
                          رصيد {transactionForm.type === 'sale' || transactionForm.type === 'sale_return' ? 'العميل' : 'المورد'}
                        </label>
                        <div className="flex flex-col gap-1">
                          <input type="text" readOnly className="w-full p-2 bg-white/50 border-none rounded-sm text-xs font-mono text-blue-600 font-bold" 
                            value={(suppliersCustomers.find(sc => sc.id === transactionForm.party_id)?.balance || 0).toLocaleString() + ' ج.م'} 
                          />
                          {transactionForm.party_id && (
                            <span className="text-[9px] opacity-50">
                              الرصيد المتوقع: {(() => {
                                const currentBalance = suppliersCustomers.find(sc => sc.id === transactionForm.party_id)?.balance || 0;
                                const netAmount = transactionForm.items.reduce((sum: number, item: any) => sum + (item.net_amount || 0), 0) - (transactionForm.discount_amount || 0);
                                const paidAmount = transactionForm.paid_amount || 0;
                                const remaining = netAmount - paidAmount;
                                
                                // For sales: balance increases by remaining amount
                                // For returns: balance decreases by remaining amount
                                let futureBalance = currentBalance;
                                if (transactionForm.type === 'sale') {
                                  futureBalance += remaining;
                                } else if (transactionForm.type === 'sale_return') {
                                  futureBalance -= remaining;
                                } else if (transactionForm.type === 'purchase') {
                                  futureBalance -= remaining; // Supplier balance is usually negative (we owe them)
                                } else if (transactionForm.type === 'purchase_return') {
                                  futureBalance += remaining;
                                }
                                return futureBalance.toLocaleString() + ' ج.م';
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">مندوب المبيعات</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.sales_rep_id || ''} onChange={e => setTransactionForm({...transactionForm, sales_rep_id: e.target.value})}
                        >
                          <option value="">اختر المندوب</option>
                          {salesReps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">شركة الشحن</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.shipping_co_id || ''} onChange={e => setTransactionForm({...transactionForm, shipping_co_id: e.target.value})}
                        >
                          <option value="">اختر الشركة</option>
                          {shippingCos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">مركز التكلفة</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.cost_center_id || ''} onChange={e => setTransactionForm({...transactionForm, cost_center_id: e.target.value})}
                        >
                          <option value="">اختر المركز</option>
                          {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">سعر الصرف</label>
                        <input type="number" step="0.0001" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                          value={transactionForm.exchange_rate || 1} onChange={e => setTransactionForm({...transactionForm, exchange_rate: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">العملة</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                          value={transactionForm.currency_id || ''} onChange={e => setTransactionForm({...transactionForm, currency_id: e.target.value})}
                        >
                          <option value="">اختر العملة</option>
                          {currencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">حساب المبيعات</label>
                        <select className="w-full p-2 bg-white border-none rounded-sm text-xs">
                          <option>مبيعات بضاعة</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Items Table Section */}
                  <div className="bg-white border border-[#141414]/10 rounded-sm overflow-hidden">
                    {transactionForm.type === 'sale_return' && previousSaleInfo && Array.isArray(previousSaleInfo) && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white w-full max-w-6xl shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[90vh] border border-[#141414]/20"
                        >
                          {/* Header */}
                          <div className="p-4 bg-[#141414] text-white flex justify-between items-center border-b border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <History size={20} className="text-blue-400" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold">تاريخ مبيعات الصنف للعميل</h3>
                                <p className="text-[10px] opacity-60">
                                  الصنف: <span className="text-blue-400 font-bold">{previousSaleInfo[0]?.product_name}</span> | مراجعة الفواتير السابقة
                                </p>
                              </div>
                            </div>
                            <button onClick={() => { setPreviousSaleInfo(null); setPreviousSaleSearch(''); }} className="p-2 hover:bg-white/10 rounded-full transition-all">
                              <X size={20} />
                            </button>
                          </div>
                          
                          {/* Search / Filter Bar */}
                          <div className="p-4 bg-[#141414]/5 border-b border-[#141414]/10 flex gap-4 items-center">
                            <div className="relative flex-1">
                              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" />
                              <input 
                                type="text" 
                                placeholder="بحث برقم الفاتورة أو التاريخ..." 
                                className="w-full pr-10 pl-4 py-2 bg-white border border-[#141414]/10 rounded-sm text-xs focus:ring-1 focus:ring-[#141414] outline-none"
                                value={previousSaleSearch}
                                onChange={(e) => setPreviousSaleSearch(e.target.value)}
                              />
                            </div>
                            <div className="text-[10px] font-bold opacity-50">
                              تم العثور على {previousSaleInfo.filter((s: any) => 
                                s.document_number?.toLowerCase().includes(previousSaleSearch.toLowerCase()) || 
                                s.date?.includes(previousSaleSearch)
                              ).length} عملية سابقة
                            </div>
                          </div>
                          
                          {/* Table Body */}
                          <div className="flex-1 overflow-auto">
                            <table className="w-full text-right border-collapse">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-[#141414] text-white text-[11px] uppercase tracking-wider">
                                  <th className="p-4 font-bold border-l border-white/10">رقم الفاتورة</th>
                                  <th className="p-4 font-bold border-l border-white/10">التاريخ</th>
                                  <th className="p-4 font-bold border-l border-white/10">الصنف</th>
                                  <th className="p-4 font-bold border-l border-white/10 text-center">المقاس</th>
                                  <th className="p-4 font-bold border-l border-white/10 text-center">اللون</th>
                                  <th className="p-4 font-bold border-l border-white/10 text-center">الكمية</th>
                                  <th className="p-4 font-bold border-l border-white/10 text-center">سعر الوحدة</th>
                                  <th className="p-4 font-bold border-l border-white/10 text-center">الخصم</th>
                                  <th className="p-4 font-bold border-l border-white/10 text-center">صافي الصنف</th>
                                  <th className="p-4 font-bold border-l border-white/10 text-center">إجمالي الفاتورة</th>
                                  <th className="p-4 font-bold text-center">الإجراء</th>
                                </tr>
                              </thead>
                              <tbody className="text-xs">
                                {previousSaleInfo
                                  .filter((s: any) => 
                                    s.document_number?.toLowerCase().includes(previousSaleSearch.toLowerCase()) || 
                                    s.date?.includes(previousSaleSearch)
                                  )
                                  .map((sale: any, idx: number) => (
                                  <tr key={idx} className="border-b border-[#141414]/5 hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-blue-600">{sale.document_number}</td>
                                    <td className="p-4 opacity-70">{sale.date}</td>
                                    <td className="p-4 font-bold">{sale.product_name}</td>
                                    <td className="p-4 text-center opacity-50">{sale.size || '-'}</td>
                                    <td className="p-4 text-center opacity-50">{sale.color || '-'}</td>
                                    <td className="p-4 text-center font-bold">{sale.quantity} {sale.unit}</td>
                                    <td className="p-4 text-center font-bold text-green-700">{sale.unit_price.toLocaleString()} ج.م</td>
                                    <td className="p-4 text-center text-red-600">{sale.discount_amount.toLocaleString()} ج.م</td>
                                    <td className="p-4 text-center font-black text-[#141414] bg-[#141414]/5">{sale.net_amount.toLocaleString()} ج.م</td>
                                    <td className="p-4 text-center opacity-50">{sale.invoice_total?.toLocaleString()} ج.م</td>
                                    <td className="p-4 text-center">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const newItems = [...transactionForm.items];
                                          const lastIdx = newItems.length - 1;
                                          newItems[lastIdx] = {
                                            ...newItems[lastIdx],
                                            unit_price: sale.unit_price,
                                            discount_percent: sale.discount_percent,
                                            discount_amount: sale.discount_amount,
                                            tax_percent: sale.tax_percent,
                                            tax_amount: sale.tax_amount,
                                            net_amount: sale.net_amount / sale.quantity * newItems[lastIdx].quantity
                                          };
                                          setTransactionForm({...transactionForm, items: newItems});
                                          setPreviousSaleInfo(null);
                                          setPreviousSaleSearch('');
                                        }}
                                        className="px-4 py-2 bg-[#141414] text-white text-[10px] font-bold rounded-sm hover:bg-blue-600 transition-all transform group-hover:scale-105"
                                      >
                                        استخدام هذه البيانات
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Footer */}
                          <div className="p-6 bg-[#141414]/5 border-t border-[#141414]/10 flex justify-between items-end">
                            <div className="flex gap-12">
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase opacity-50 font-bold">متوسط سعر البيع</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-[#141414]">
                                    {(previousSaleInfo.reduce((acc: number, s: any) => acc + Number(s.unit_price), 0) / previousSaleInfo.length).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                  </span>
                                  <span className="text-[10px] font-bold opacity-40">ج.م</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.from(new Set(previousSaleInfo.map((s: any) => s.unit_price))).map((price: any, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white border border-[#141414]/10 rounded-full text-[9px] font-bold">
                                      {price.toLocaleString()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase opacity-50 font-bold">إجمالي الكميات المباعة</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-blue-600">
                                    {previousSaleInfo.reduce((acc: number, s: any) => acc + Number(s.quantity), 0)}
                                  </span>
                                  <span className="text-[10px] font-bold opacity-40">{previousSaleInfo[0]?.unit}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => { setPreviousSaleInfo(null); setPreviousSaleSearch(''); }}
                                className="px-12 py-3 bg-white border border-[#141414]/20 text-[#141414] text-xs font-bold rounded-sm hover:bg-gray-50 transition-all shadow-sm"
                              >
                                إغلاق النافذة
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50 w-10">#</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">كود الصنف</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">الصنف</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">الوحدة</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">الكمية</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">السعر</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">الخصم %</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">الخصم</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">ض ق م</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50">الإجمالي</th>
                          <th className="p-2 text-[10px] font-bold uppercase opacity-50 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {transactionForm.items.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-2 text-xs font-mono opacity-50">{index + 1}</td>
                            <td className="p-2">
                              <input type="text" className="w-full p-1 bg-transparent border-none text-xs font-mono" 
                                placeholder="كود / باركود"
                                value={products.find(p => p.id === item.product_id)?.sku || ''}
                                onChange={e => {
                                  const code = e.target.value;
                                  const product = products.find(p => p.sku === code || p.barcode === code || p.code2 === code || p.electronic_invoice_code === code);
                                  if (product) {
                                    const newItems = [...transactionForm.items];
                                    let price = 0;
                                    if (transactionForm.pricing_type === 'wholesale') price = product?.wholesale_price || 0;
                                    else if (transactionForm.pricing_type === 'half_wholesale') price = product?.half_wholesale_price || 0;
                                    else price = product?.sale_price || 0;

                                    const base = price * item.quantity;
                                    const disc = base * (item.discount_percent / 100);
                                    const defaultTax = product?.is_taxable !== false ? Number(systemSettings.default_tax_percent || 14) : 0;
                                    const tax = (base - disc) * (defaultTax / 100);

                                    newItems[index] = { 
                                      ...item, 
                                      product_id: product.id, 
                                      unit: product?.unit || 'قطعة',
                                      unit_price: price,
                                      tax_percent: defaultTax,
                                      discount_amount: disc,
                                      tax_amount: tax,
                                      net_amount: base - disc + tax
                                    };
                                    setTransactionForm({...transactionForm, items: newItems});
                                    if (transactionForm.type === 'sale_return') {
                                      checkPreviousSale(transactionForm.party_id, product.id);
                                    }
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <select className="w-full p-1 bg-transparent border-none text-xs font-bold"
                                value={item.product_id}
                                onChange={e => {
                                  const product = products.find(p => p.id === e.target.value);
                                  const newItems = [...transactionForm.items];
                                  if (product && transactionForm.type === 'sale_return') {
                                    checkPreviousSale(transactionForm.party_id, product.id);
                                  }
                                  let price = 0;
                                  if (transactionForm.pricing_type === 'wholesale') price = product?.wholesale_price || 0;
                                  else if (transactionForm.pricing_type === 'half_wholesale') price = product?.half_wholesale_price || 0;
                                  else price = product?.sale_price || 0;

                                  const base = price * item.quantity;
                                  const disc = base * (item.discount_percent / 100);
                                  const defaultTax = product?.is_taxable !== false ? Number(systemSettings.default_tax_percent || 14) : 0;
                                  const tax = (base - disc) * (defaultTax / 100);

                                  newItems[index] = { 
                                    ...item, 
                                    product_id: e.target.value, 
                                    unit: product?.unit || 'قطعة',
                                    unit_price: price,
                                    tax_percent: defaultTax,
                                    discount_amount: disc,
                                    tax_amount: tax,
                                    net_amount: base - disc + tax
                                  };
                                  setTransactionForm({...transactionForm, items: newItems});
                                }}
                              >
                                <option value="">اختر الصنف</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </td>
                            <td className="p-2 text-xs opacity-50">
                              {item.unit || '---'}
                            </td>
                            <td className="p-2">
                              <input type="number" className="w-20 p-1 bg-transparent border-none text-xs font-mono font-bold text-center" 
                                value={item.quantity || 0} onChange={e => {
                                  const qty = Number(e.target.value);
                                  const newItems = [...transactionForm.items];
                                  const base = item.unit_price * qty;
                                  const disc = base * (item.discount_percent / 100);
                                  const tax = (base - disc) * (item.tax_percent / 100);
                                  newItems[index] = { ...item, quantity: qty, discount_amount: disc, tax_amount: tax, net_amount: base - disc + tax };
                                  setTransactionForm({...transactionForm, items: newItems});
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input type="number" className="w-24 p-1 bg-transparent border-none text-xs font-mono font-bold text-center" 
                                value={item.unit_price || 0} onChange={e => {
                                  const price = Number(e.target.value);
                                  const newItems = [...transactionForm.items];
                                  const base = price * item.quantity;
                                  const disc = base * (item.discount_percent / 100);
                                  const tax = (base - disc) * (item.tax_percent / 100);
                                  newItems[index] = { ...item, unit_price: price, discount_amount: disc, tax_amount: tax, net_amount: base - disc + tax };
                                  setTransactionForm({...transactionForm, items: newItems});
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input type="number" className="w-16 p-1 bg-transparent border-none text-xs font-mono text-center" 
                                value={item.discount_percent || 0} onChange={e => {
                                  const disc_p = Number(e.target.value);
                                  const newItems = [...transactionForm.items];
                                  const base = item.unit_price * item.quantity;
                                  const disc_amt = base * (disc_p / 100);
                                  const tax = (base - disc_amt) * (item.tax_percent / 100);
                                  newItems[index] = { ...item, discount_percent: disc_p, discount_amount: disc_amt, tax_amount: tax, net_amount: base - disc_amt + tax };
                                  setTransactionForm({...transactionForm, items: newItems});
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input type="number" className="w-20 p-1 bg-transparent border-none text-xs font-mono text-center" 
                                value={item.discount_amount || 0} onChange={e => {
                                  const disc_amt = Number(e.target.value);
                                  const newItems = [...transactionForm.items];
                                  const base = item.unit_price * item.quantity;
                                  const disc_p = base > 0 ? (disc_amt / base) * 100 : 0;
                                  const tax = (base - disc_amt) * (item.tax_percent / 100);
                                  newItems[index] = { ...item, discount_amount: disc_amt, discount_percent: disc_p, tax_amount: tax, net_amount: base - disc_amt + tax };
                                  setTransactionForm({...transactionForm, items: newItems});
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input type="number" className="w-16 p-1 bg-transparent border-none text-xs font-mono text-center" 
                                value={item.tax_percent || 0} onChange={e => {
                                  const tax_p = Number(e.target.value);
                                  const newItems = [...transactionForm.items];
                                  const base = item.unit_price * item.quantity;
                                  const disc_amt = item.discount_amount || 0;
                                  const tax_amt = (base - disc_amt) * (tax_p / 100);
                                  newItems[index] = { ...item, tax_percent: tax_p, tax_amount: tax_amt, net_amount: base - disc_amt + tax_amt };
                                  setTransactionForm({...transactionForm, items: newItems});
                                }}
                              />
                            </td>
                            <td className="p-2 text-xs font-mono font-bold">
                              {(item.net_amount || 0).toFixed(2)}
                            </td>
                            <td className="p-2">
                              <button type="button" onClick={() => {
                                const newItems = transactionForm.items.filter((_: any, i: number) => i !== index);
                                setTransactionForm({...transactionForm, items: newItems});
                              }} className="text-red-500 hover:text-red-700">
                                <MinusCircle size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" onClick={() => setTransactionForm({...transactionForm, items: [...transactionForm.items, { product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, tax_percent: Number(systemSettings.default_tax_percent || 14), tax_amount: 0, net_amount: 0 }]})}
                      className="w-full p-3 bg-[#141414]/5 text-[10px] font-bold uppercase hover:bg-[#141414]/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> إضافة صنف جديد
                    </button>
                  </div>

                  {/* Footer Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {/* Shipping & Delivery Section */}
                      <div className="bg-white/50 p-4 rounded-sm space-y-4 border border-[#141414]/5">
                        <h4 className="text-xs font-bold uppercase opacity-50 border-b border-[#141414]/10 pb-2">بيانات الشحن والتوصيل</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">سيارة النقل</label>
                            <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                              value={transactionForm.transport_car_id || ''} onChange={e => setTransactionForm({...transactionForm, transport_car_id: e.target.value})}
                            >
                              <option value="">اختر السيارة</option>
                              {transportCars.map(c => <option key={c.id} value={c.id}>{c.name} - {c.plate_number}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">السائق</label>
                            <select className="w-full p-2 bg-white border-none rounded-sm text-xs"
                              value={transactionForm.transport_driver_id || ''} onChange={e => setTransactionForm({...transactionForm, transport_driver_id: e.target.value})}
                            >
                              <option value="">اختر السائق</option>
                              {transportDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="is_delivery" checked={transactionForm.is_delivery} onChange={e => setTransactionForm({...transactionForm, is_delivery: e.target.checked})} />
                          <label htmlFor="is_delivery" className="text-[10px] font-bold uppercase opacity-50">توصيل للمنزل</label>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-50">ملاحظات التوصيل</label>
                          <textarea className="w-full p-2 bg-white border-none rounded-sm text-xs h-16" 
                            value={transactionForm.delivery_notes || ''} onChange={e => setTransactionForm({...transactionForm, delivery_notes: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="bg-white/50 p-4 rounded-sm space-y-3 border border-[#141414]/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase opacity-50">الإجمالي محلي</span>
                          <span className="text-sm font-mono font-bold">
                            {transactionForm.items.reduce((sum: number, item: any) => sum + ((item.unit_price || 0) * (item.quantity || 0)), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase opacity-50">إجمالي الكمية</span>
                          <span className="text-sm font-mono font-bold">
                            {transactionForm.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase opacity-50">إجمالي الخصم (الأصناف)</span>
                          <span className="text-sm font-mono font-bold text-red-500">
                            {Number(transactionForm.total_discount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">خصم إضافي %</label>
                            <input type="number" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                              value={transactionForm.discount_percent || 0} onChange={e => setTransactionForm({...transactionForm, discount_percent: Number(e.target.value)})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">قيمة الخصم الإضافي</label>
                            <input type="number" className="w-full p-2 bg-white border-none rounded-sm text-xs font-mono" 
                              value={transactionForm.discount_amount || 0} onChange={e => setTransactionForm({...transactionForm, discount_amount: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#141414]/10">
                          <span className="text-lg font-sans font-bold uppercase">الصافي</span>
                          <span className="text-2xl font-mono font-bold text-blue-600">
                            {Number(transactionForm.net_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white/50 p-4 rounded-sm space-y-4 border border-[#141414]/5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-50">المدفوع</label>
                          <input type="number" className="w-full p-3 bg-white border-none rounded-sm text-xl font-mono font-bold text-green-600" 
                            value={transactionForm.paid_amount || 0} onChange={e => setTransactionForm({...transactionForm, paid_amount: Number(e.target.value)})}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase opacity-50">المتبقي</span>
                          <span className="text-xl font-mono font-bold text-red-600">
                            {(transactionForm.items.reduce((sum: number, item: any) => sum + (item.net_amount || 0), 0) - (transactionForm.discount_amount || 0) - (transactionForm.paid_amount || 0)).toFixed(2)}
                          </span>
                        </div>
                        <div className="pt-4 flex flex-wrap gap-2">
                          <button type="button" className="flex-1 py-2 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-sm">طباعة إيصال</button>
                          <button type="button" className="flex-1 py-2 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-sm">تصدير إكسيل</button>
                        </div>
                      </div>

                      <div className="bg-white/50 p-4 rounded-sm space-y-4 border border-[#141414]/5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-50">ملاحظات الفاتورة</label>
                          <textarea className="w-full p-3 bg-white border-none rounded-sm text-xs h-24" 
                            value={transactionForm.notes || ''} onChange={e => setTransactionForm({...transactionForm, notes: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-[#141414]/10">
                    <button type="button" onClick={() => setShowTransactionModal(false)} className="px-8 py-3 text-sm font-bold uppercase opacity-50 hover:opacity-100 transition-opacity">إلغاء</button>
                    {!editingTransaction && (
                      <button type="button" onClick={handleSaveAndNew} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2">
                        <Plus size={18} /> حفظ وجديد
                      </button>
                    )}
                    <button type="button" onClick={async () => {
                      const currentForm = { ...transactionForm };
                      const success = await handleTransactionSubmit(null as any, false);
                      if (success) {
                        handlePrintTransaction(currentForm);
                        setShowTransactionModal(false);
                        setEditingTransaction(null);
                      }
                    }} disabled={isSubmitting} className="px-8 py-3 bg-green-600 text-white font-bold rounded-sm hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2">
                      <Printer size={18} /> {editingTransaction ? 'تحديث وطباعة' : 'حفظ وطباعة'}
                    </button>
                    <button type="submit" disabled={isSubmitting} className={cn(
                      "px-12 py-3 bg-[#141414] text-[#E4E3E0] font-bold rounded-sm hover:bg-[#141414]/90 transition-colors shadow-lg flex items-center justify-center gap-2",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}>
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <FileCheck size={18} />} 
                      {editingTransaction ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {activeReport && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#141414]/90 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-[#E4E3E0] w-full max-w-6xl min-h-[90vh] flex flex-col relative shadow-2xl"
              >
                {/* Header */}
                <div className="bg-[#141414] text-white p-6 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-widest">التقارير</h2>
                      <p className="text-[10px] opacity-50 uppercase tracking-widest">{activeReport}</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                {/* Filters */}
                <div className="p-6 bg-white border-b border-[#141414]/10 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">من تاريخ</label>
                    <input type="date" className="w-full p-2 bg-[#E4E3E0]/50 border-none rounded-sm text-xs" 
                      value={reportFilters.startDate} onChange={e => setReportFilters({...reportFilters, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">إلى تاريخ</label>
                    <input type="date" className="w-full p-2 bg-[#E4E3E0]/50 border-none rounded-sm text-xs" 
                      value={reportFilters.endDate} onChange={e => setReportFilters({...reportFilters, endDate: e.target.value})}
                    />
                  </div>
                  {(activeReport === 'كشف حساب تفصيلي' || activeReport === 'تقرير مبيعات العملاء' || activeReport === 'تقرير مبيعات الأصناف' || activeReport === 'تقرير مبيعات المناديب' || activeReport === 'تقرير مرتجعات المبيعات') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">العميل/المورد</label>
                      <select className="w-full p-2 bg-[#E4E3E0]/50 border-none rounded-sm text-xs"
                        value={reportFilters.partyId} onChange={e => setReportFilters({...reportFilters, partyId: e.target.value, accountId: ''})}
                      >
                        <option value="">جميع العملاء/الموردين</option>
                        {suppliersCustomers.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                      </select>
                    </div>
                  )}
                  {activeReport === 'كشف حساب تفصيلي' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">أو حساب من شجرة الحسابات</label>
                      <select className="w-full p-2 bg-[#E4E3E0]/50 border-none rounded-sm text-xs"
                        value={reportFilters.accountId} onChange={e => setReportFilters({...reportFilters, accountId: e.target.value, partyId: ''})}
                      >
                        <option value="">اختر الحساب</option>
                        {chartOfAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>)}
                      </select>
                    </div>
                  )}
                  {(activeReport === 'تقرير حركة صنف' || activeReport === 'تقرير مبيعات الأصناف') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الصنف</label>
                      <select className="w-full p-2 bg-[#E4E3E0]/50 border-none rounded-sm text-xs"
                        value={reportFilters.productId} onChange={e => setReportFilters({...reportFilters, productId: e.target.value})}
                      >
                        <option value="">اختر الصنف</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                  {activeReport === 'تقرير مبيعات المناديب' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">المندوب</label>
                      <select className="w-full p-2 bg-[#E4E3E0]/50 border-none rounded-sm text-xs"
                        value={reportFilters.salesRepId} onChange={e => setReportFilters({...reportFilters, salesRepId: e.target.value})}
                      >
                        <option value="">جميع المناديب</option>
                        {salesReps.map(sr => <option key={sr.id} value={sr.id}>{sr.name}</option>)}
                      </select>
                    </div>
                  )}
                  {activeReport === 'تقرير أرصدة المستودعات' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">المستودع</label>
                      <select className="w-full p-2 bg-[#E4E3E0]/50 border-none rounded-sm text-xs"
                        value={reportFilters.warehouseId} onChange={e => setReportFilters({...reportFilters, warehouseId: e.target.value})}
                      >
                        <option value="">جميع المستودعات</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex items-end">
                    <button className="w-full bg-[#141414] text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">تحديث التقرير</button>
                  </div>
                </div>

                {/* Report Content */}
                <div className="flex-1 p-8 overflow-y-auto bg-[#E4E3E0]/50">
                  <div id="report-content-to-print" className="bg-white p-12 shadow-sm min-h-full max-w-5xl mx-auto border border-[#141414]/5">
                    <div className="text-center mb-12 border-b border-[#141414]/10 pb-8">
                      <h3 className="text-xl font-bold mb-2">{activeReport}</h3>
                      <p className="text-xs opacity-50 uppercase tracking-widest">الفترة من {reportFilters.startDate} إلى {reportFilters.endDate}</p>
                    </div>

                    {activeReport === 'تقرير ضريبة القيمة المضافة' && (() => {
                      const data = getTaxReportData();
                      return (
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-8 text-xs mb-8">
                            <div>
                              <p className="opacity-50 mb-1">الفترة من:</p>
                              <p className="font-bold">{reportFilters.startDate}</p>
                            </div>
                            <div className="text-left">
                              <p className="opacity-50 mb-1">إلى تاريخ:</p>
                              <p className="font-bold">{reportFilters.endDate}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="font-bold border-b pb-2">المبيعات (الضريبة المخرجة)</h4>
                              <div className="flex justify-between text-sm">
                                <span>إجمالي المبيعات (بدون ضريبة):</span>
                                <span className="font-mono">{data.totalSalesAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm text-blue-600 font-bold">
                                <span>إجمالي الضريبة المخرجة:</span>
                                <span className="font-mono">{data.totalOutputTax.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="font-bold border-b pb-2">المشتريات (الضريبة المدخلة)</h4>
                              <div className="flex justify-between text-sm">
                                <span>إجمالي المشتريات (بدون ضريبة):</span>
                                <span className="font-mono">{data.totalPurchasesAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm text-green-600 font-bold">
                                <span>إجمالي الضريبة المدخلة:</span>
                                <span className="font-mono">{data.totalInputTax.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-12 p-6 bg-gray-50 border-2 border-[#141414] rounded-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold">صافي الضريبة المستحقة:</span>
                              <span className={`text-2xl font-mono font-bold ${data.netTax >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {data.netTax.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[10px] mt-2 opacity-50">
                              * إذا كان المبلغ موجباً فهو مستحق للدفع، وإذا كان سالباً فهو رصيد دائن (مسترد).
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {activeReport === 'كشف حساب تفصيلي' && (() => {
                      const { openingBalance, transactions: reportTransactions } = getAccountStatementData();
                      return (
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-8 text-xs mb-8">
                            <div>
                              <p className="opacity-50 mb-1">اسم الحساب:</p>
                              <p className="font-bold">{reportFilters.partyId ? (suppliersCustomers.find(sc => sc.id === reportFilters.partyId)?.name || 'لم يتم الاختيار') : (chartOfAccounts.find(acc => acc.id === reportFilters.accountId)?.name || 'لم يتم الاختيار')}</p>
                            </div>
                            <div className="text-left">
                              <p className="opacity-50 mb-1">تاريخ التقرير:</p>
                              <p className="font-bold">{new Date().toLocaleDateString('ar-EG')}</p>
                            </div>
                          </div>
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b-2 border-[#141414] font-bold">
                                <th className="py-3 px-4">التاريخ</th>
                                <th className="py-3 px-4">رقم السند</th>
                                <th className="py-3 px-4">البيان</th>
                                <th className="py-3 px-4">مدين</th>
                                <th className="py-3 px-4">دائن</th>
                                <th className="py-3 px-4">الرصيد</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-[#141414]/5 hover:bg-[#141414]/5 transition-colors">
                                <td className="py-3 px-4">{reportFilters.startDate}</td>
                                <td className="py-3 px-4">-</td>
                                <td className="py-3 px-4 font-bold">رصيد أول المدة</td>
                                <td className="py-3 px-4">{openingBalance >= 0 ? openingBalance.toFixed(2) : '0.00'}</td>
                                <td className="py-3 px-4">{openingBalance < 0 ? Math.abs(openingBalance).toFixed(2) : '0.00'}</td>
                                <td className="py-3 px-4 font-bold">{openingBalance.toFixed(2)}</td>
                              </tr>
                              {reportTransactions.map((t: any) => {
                                return (
                                  <tr key={t.id} className="border-b border-[#141414]/5 hover:bg-[#141414]/5 transition-colors">
                                    <td className="py-3 px-4">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="py-3 px-4 font-mono">{t.document_number || '-'}</td>
                                    <td className="py-3 px-4">
                                      {t.description}
                                    </td>
                                    <td className="py-3 px-4">{t.isDebit ? Number(t.displayAmount).toFixed(2) : '0.00'}</td>
                                    <td className="py-3 px-4">{!t.isDebit ? Number(t.displayAmount).toFixed(2) : '0.00'}</td>
                                    <td className="py-3 px-4 font-bold">{t.runningBalance.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                    {activeReport === 'تقرير حركة صنف' && (() => {
                      const { openingStock, movements } = getProductMovementData();
                      return (
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-8 text-xs mb-8">
                            <div>
                              <p className="opacity-50 mb-1">اسم الصنف:</p>
                              <p className="font-bold">{products.find(p => p.id === reportFilters.productId)?.name || 'لم يتم الاختيار'}</p>
                            </div>
                            <div className="text-left">
                              <p className="opacity-50 mb-1">رصيد أول المدة:</p>
                              <p className="font-bold">{openingStock}</p>
                            </div>
                          </div>
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b-2 border-[#141414] font-bold">
                                <th className="py-3 px-4">التاريخ</th>
                                <th className="py-3 px-4">نوع الحركة</th>
                                <th className="py-3 px-4">رقم السند</th>
                                <th className="py-3 px-4">الجهة</th>
                                <th className="py-3 px-4">وارد</th>
                                <th className="py-3 px-4">منصرف</th>
                                <th className="py-3 px-4">الرصيد</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-[#141414]/5 bg-[#141414]/5">
                                <td className="py-3 px-4">{reportFilters.startDate}</td>
                                <td className="py-3 px-4 font-bold" colSpan={3}>رصيد أول المدة</td>
                                <td className="py-3 px-4">-</td>
                                <td className="py-3 px-4">-</td>
                                <td className="py-3 px-4 font-bold">{openingStock}</td>
                              </tr>
                              {movements.map((m, idx) => (
                                <tr key={idx} className="border-b border-[#141414]/5 hover:bg-[#141414]/5 transition-colors">
                                  <td className="py-3 px-4">{new Date(m.date).toLocaleDateString('ar-EG')}</td>
                                  <td className="py-3 px-4">
                                    {m.type === 'sale' ? 'مبيعات' : 
                                     m.type === 'purchase' ? 'مشتريات' : 
                                     m.type === 'sale_return' ? 'مرتجع مبيعات' : 'مرتجع مشتريات'}
                                  </td>
                                  <td className="py-3 px-4 font-mono">{m.doc_num}</td>
                                  <td className="py-3 px-4">{m.party}</td>
                                  <td className="py-3 px-4 text-green-600">{m.in > 0 ? m.in : '-'}</td>
                                  <td className="py-3 px-4 text-red-600">{m.out > 0 ? m.out : '-'}</td>
                                  <td className="py-3 px-4 font-bold">{m.balance}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                    {(activeReport === 'تقرير مبيعات العملاء' || activeReport === 'تقرير مبيعات الأصناف' || activeReport === 'تقرير مبيعات المناديب' || activeReport === 'تقرير مرتجعات المبيعات') && (() => {
                      const salesData = getSalesReportData();
                      const totalSales = salesData.reduce((sum, t) => sum + (t.type === 'sale' ? t.total_amount : -t.total_amount), 0);
                      return (
                        <div className="space-y-8">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b-2 border-[#141414] font-bold">
                                <th className="py-3 px-4">التاريخ</th>
                                <th className="py-3 px-4">رقم الفاتورة</th>
                                <th className="py-3 px-4">العميل</th>
                                <th className="py-3 px-4">النوع</th>
                                <th className="py-3 px-4">طريقة الدفع</th>
                                <th className="py-3 px-4">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesData.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-10 text-center opacity-50">لا توجد بيانات لهذه الفترة</td>
                                </tr>
                              ) : salesData.map(t => (
                                <tr key={t.id} className="border-b border-[#141414]/5 hover:bg-[#141414]/5 transition-colors">
                                  <td className="py-3 px-4">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                  <td className="py-3 px-4 font-mono">{t.document_number}</td>
                                  <td className="py-3 px-4">{suppliersCustomers.find(sc => sc.id === t.party_id)?.name || '-'}</td>
                                  <td className="py-3 px-4">{t.type === 'sale' ? 'مبيعات' : 'مرتجع مبيعات'}</td>
                                  <td className="py-3 px-4">{t.payment_method === 'cash' ? 'نقدي' : t.payment_method === 'credit' ? 'أجل' : t.payment_method}</td>
                                  <td className={`py-3 px-4 font-bold ${t.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                                    {(t.type === 'sale' ? t.total_amount : -t.total_amount).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            {salesData.length > 0 && (
                              <tfoot>
                                <tr className="bg-[#141414] text-white font-bold">
                                  <td className="py-3 px-4" colSpan={5}>إجمالي المبيعات</td>
                                  <td className="py-3 px-4">{totalSales.toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      );
                    })()}

                    {activeReport === 'تقرير أرصدة المستودعات' && (
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b-2 border-[#141414] font-bold">
                            <th className="py-3 px-4">كود الصنف</th>
                            <th className="py-3 px-4">اسم الصنف</th>
                            <th className="py-3 px-4">المستودع</th>
                            <th className="py-3 px-4">الكمية</th>
                            <th className="py-3 px-4">متوسط التكلفة</th>
                            <th className="py-3 px-4">إجمالي القيمة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.filter(p => !reportFilters.warehouseId || p.warehouse_id === reportFilters.warehouseId).map(p => (
                            <tr key={p.id} className="border-b border-[#141414]/5 hover:bg-[#141414]/5 transition-colors">
                              <td className="py-3 px-4 font-mono">{p.sku}</td>
                              <td className="py-3 px-4">{p.name}</td>
                              <td className="py-3 px-4">{warehouses.find(w => w.id === p.warehouse_id)?.name || '-'}</td>
                              <td className="py-3 px-4">{p.quantity}</td>
                              <td className="py-3 px-4">{p.cost_price}</td>
                              <td className="py-3 px-4 font-bold">{(p.quantity * p.cost_price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {![
                      'كشف حساب تفصيلي',
                      'تقرير حركة صنف',
                      'تقرير مبيعات العملاء',
                      'تقرير مبيعات الأصناف',
                      'تقرير مبيعات المناديب',
                      'تقرير مرتجعات المبيعات',
                      'تقرير أرصدة المستودعات'
                    ].includes(activeReport || '') && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <FileText size={48} className="mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">هذا التقرير قيد التطوير</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-[#141414]/10 flex justify-end gap-4">
                  <button onClick={handlePrintReport} className="px-8 py-3 bg-[#141414]/5 text-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/10 transition-colors flex items-center gap-2">
                    <Printer size={16} /> طباعة التقرير
                  </button>
                  <button onClick={() => setActiveReport(null)} className="px-8 py-3 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">إغلاق</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* Warehouse Modal */}
        <AnimatePresence>
          {showWarehouseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-bg)] w-full max-w-md p-8 border border-[#141414]/10 shadow-2xl relative"
              >
                <button onClick={() => setShowWarehouseModal(false)} className="absolute top-4 left-4 opacity-50 hover:opacity-100"><X size={20} /></button>
                <h2 className="text-2xl font-sans font-bold mb-6">إضافة مخزن جديد</h2>
                <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">اسم المخزن</label>
                    <input 
                      type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={warehouseForm.name || ''} onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الموقع / العنوان</label>
                    <input 
                      type="text" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={warehouseForm.location || ''} onChange={e => setWarehouseForm({...warehouseForm, location: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" id="is_default"
                      checked={warehouseForm.is_default} onChange={e => setWarehouseForm({...warehouseForm, is_default: e.target.checked})}
                    />
                    <label htmlFor="is_default" className="text-xs font-bold opacity-50">تعيين كمخزن افتراضي</label>
                  </div>
                  <button type="submit" className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4">حفظ المخزن</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Stock Movement Modal */}
        <AnimatePresence>
          {showMovementModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-bg)] w-full max-w-md p-8 border border-[#141414]/10 shadow-2xl relative"
              >
                <button onClick={() => setShowMovementModal(false)} className="absolute top-4 left-4 opacity-50 hover:opacity-100"><X size={20} /></button>
                <h2 className="text-2xl font-sans font-bold mb-6">حركة مخزون جديدة</h2>
                <form onSubmit={handleMovementSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">المنتج</label>
                    <select 
                      required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                      value={movementForm.product_id || ''} onChange={e => setMovementForm({...movementForm, product_id: e.target.value})}
                    >
                      <option value="">اختر المنتج</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (رصيد: {p.quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">نوع الحركة</label>
                      <select 
                        className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={movementForm.type || ''} onChange={e => setMovementForm({...movementForm, type: e.target.value})}
                      >
                        <option value="transfer">تحويل بين مخازن</option>
                        <option value="adjustment">تسوية كمية</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الكمية</label>
                      <input 
                        type="number" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={movementForm.quantity || 0} onChange={e => setMovementForm({...movementForm, quantity: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  {movementForm.type === 'transfer' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">من مخزن</label>
                        <select 
                          required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                          value={movementForm.from_warehouse_id || ''} onChange={e => setMovementForm({...movementForm, from_warehouse_id: e.target.value})}
                        >
                          <option value="">اختر</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">إلى مخزن</label>
                        <select 
                          required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                          value={movementForm.to_warehouse_id || ''} onChange={e => setMovementForm({...movementForm, to_warehouse_id: e.target.value})}
                        >
                          <option value="">اختر</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">المخزن المعني</label>
                      <select 
                        required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={movementForm.to_warehouse_id || ''} onChange={e => setMovementForm({...movementForm, to_warehouse_id: e.target.value})}
                      >
                        <option value="">اختر</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">السبب / ملاحظات</label>
                    <textarea 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm h-20" 
                      value={movementForm.reason || ''} onChange={e => setMovementForm({...movementForm, reason: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4">تنفيذ الحركة</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Expense Modal */}
        <AnimatePresence>
          {showExpenseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-bg)] w-full max-w-md p-8 border border-[#141414]/10 shadow-2xl relative"
              >
                <button onClick={() => setShowExpenseModal(false)} className="absolute top-4 left-4 opacity-50 hover:opacity-100"><X size={20} /></button>
                <h2 className="text-2xl font-sans font-bold mb-6">{expenseForm.id ? 'تعديل سجل مالي' : 'تسجيل حركة مالية'}</h2>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">نوع الحركة</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setExpenseForm({...expenseForm, type: 'income'})}
                        className={cn(
                          "py-2 text-xs font-bold rounded-sm border transition-all",
                          expenseForm.type === 'income' ? "bg-green-600 text-white border-green-600" : "bg-white text-green-600 border-green-600/20"
                        )}
                      >
                        إيراد (+)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setExpenseForm({...expenseForm, type: 'expense'})}
                        className={cn(
                          "py-2 text-xs font-bold rounded-sm border transition-all",
                          expenseForm.type === 'expense' ? "bg-red-600 text-white border-red-600" : "bg-white text-red-600 border-red-600/20"
                        )}
                      >
                        مصروف (-)
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">المبلغ</label>
                      <input 
                        type="number" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={expenseForm.amount || 0} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">التاريخ</label>
                      <input 
                        type="date" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={expenseForm.date || ''} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">التصنيف</label>
                    <select 
                      required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                      value={expenseForm.category_id || ''} onChange={e => setExpenseForm({...expenseForm, category_id: e.target.value})}
                    >
                      <option value="">اختر التصنيف</option>
                      {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الحساب البنكي / الخزينة</label>
                    <select 
                      required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                      value={expenseForm.account_id || ''} onChange={e => setExpenseForm({...expenseForm, account_id: e.target.value})}
                    >
                      <option value="">اختر الحساب</option>
                      {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.balance} ج.م)</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الوصف / ملاحظات</label>
                    <textarea 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm h-20" 
                      value={expenseForm.description || ''} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (expenseForm.id ? 'تحديث السجل' : 'حفظ السجل')}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Definition Modal */}
        <AnimatePresence>
          {showCOAModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-card-bg)] w-full max-w-md p-8 border border-[#141414]/10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-sans font-bold">إضافة حساب جديد</h3>
                  <button onClick={() => setShowCOAModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={handleCOASubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">اسم الحساب</label>
                    <input 
                      type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={coaForm.name || ''} onChange={e => setCOAForm({...coaForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">كود الحساب</label>
                    <input 
                      type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={coaForm.code || ''} onChange={e => setCOAForm({...coaForm, code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">نوع الحساب</label>
                    <select 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                      value={coaForm.type || 'asset'} onChange={e => setCOAForm({...coaForm, type: e.target.value as any})}
                    >
                      <option value="asset">أصول</option>
                      <option value="liability">خصوم</option>
                      <option value="equity">حقوق ملكية</option>
                      <option value="revenue">إيرادات</option>
                      <option value="expense">مصروفات</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الحساب الأب (اختياري)</label>
                    <select 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                      value={coaForm.parent_id || ''} onChange={e => setCOAForm({...coaForm, parent_id: e.target.value})}
                    >
                      <option value="">لا يوجد</option>
                      {chartOfAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الوصف (اختياري)</label>
                    <textarea 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      rows={2}
                      value={coaForm.description || ''} onChange={e => setCOAForm({...coaForm, description: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (coaForm.id ? 'تحديث الحساب' : 'حفظ الحساب')}
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {showQuoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-card-bg)] w-full max-w-4xl p-8 border border-[#141414]/10 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-sans font-bold">إنشاء عرض سعر جديد</h3>
                  <button onClick={() => setShowQuoteModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={handleQuoteSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">العميل</label>
                      <select 
                        className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={quoteForm.party_id || ''} onChange={e => setQuoteForm({...quoteForm, party_id: e.target.value})}
                      >
                        <option value="">اختر عميل...</option>
                        {suppliersCustomers.filter(sc => sc.type === 'customer').map(sc => (
                          <option key={sc.id} value={sc.id}>{sc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">التاريخ</label>
                      <input 
                        type="date" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={quoteForm.date || ''} onChange={e => setQuoteForm({...quoteForm, date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold opacity-70">الأصناف</h4>
                      <button 
                        type="button"
                        onClick={() => setQuoteForm({...quoteForm, items: [...quoteForm.items, { product_id: '', quantity: 1, unit_price: 0 }]})}
                        className="text-xs font-bold text-blue-600 flex items-center gap-1"
                      ><Plus size={14} /> إضافة صنف</button>
                    </div>
                    <div className="space-y-2">
                      {quoteForm.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5 space-y-1">
                            <label className="text-[8px] font-bold uppercase opacity-30">المنتج</label>
                            <select 
                              className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs"
                              value={item.product_id || ''} 
                              onChange={e => {
                                const newItems = [...quoteForm.items];
                                const prod = products.find(p => p.id === e.target.value);
                                newItems[idx] = { 
                                  ...newItems[idx], 
                                  product_id: e.target.value,
                                  unit_price: prod?.sale_price || 0
                                };
                                setQuoteForm({...quoteForm, items: newItems});
                              }}
                            >
                              <option value="">اختر منتج...</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] font-bold uppercase opacity-30">الكمية</label>
                            <input 
                              type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs"
                              value={item.quantity || 0} onChange={e => {
                                const newItems = [...quoteForm.items];
                                newItems[idx].quantity = Number(e.target.value);
                                setQuoteForm({...quoteForm, items: newItems});
                              }}
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] font-bold uppercase opacity-30">سعر الوحدة</label>
                            <input 
                              type="number" className="w-full p-2 bg-[#141414]/5 border-none rounded-sm text-xs"
                              value={item.unit_price || 0} onChange={e => {
                                const newItems = [...quoteForm.items];
                                newItems[idx].unit_price = Number(e.target.value);
                                setQuoteForm({...quoteForm, items: newItems});
                              }}
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] font-bold uppercase opacity-30">الإجمالي</label>
                            <div className="w-full p-2 bg-[#141414]/5 rounded-sm text-xs font-mono font-bold">
                              {(item.quantity * item.unit_price).toLocaleString()}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <button 
                              type="button"
                              onClick={() => {
                                const newItems = quoteForm.items.filter((_, i) => i !== idx);
                                setQuoteForm({...quoteForm, items: newItems});
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-sm"
                            ><X size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">ملاحظات</label>
                    <textarea 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" rows={3}
                      value={quoteForm.notes || ''} onChange={e => setQuoteForm({...quoteForm, notes: e.target.value})}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-[#141414]/10">
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-50">إجمالي العرض</p>
                      <h4 className="text-2xl font-mono font-bold">
                        {quoteForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()} ج.م
                      </h4>
                    </div>
                    <button type="submit" className="px-12 py-4 bg-[#141414] text-[#E4E3E0] font-bold">حفظ عرض السعر</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

            {showUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[var(--app-card-bg)] w-full max-w-md p-8 border border-[#141414]/10 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-sans font-bold">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
                    <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-full"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">اسم المستخدم (Username)</label>
                      <input 
                        type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm font-mono" 
                        value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الاسم الكامل</label>
                      <input 
                        type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">كلمة المرور {editingUser && '(اتركها فارغة لعدم التغيير)'}</label>
                      <input 
                        type="password" required={!editingUser} className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الصلاحية</label>
                      <select 
                        className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}
                      >
                        <option value="user">مستخدم عادي</option>
                        <option value="admin">مدير نظام</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <input 
                        type="checkbox" id="is_active" className="w-4 h-4"
                        checked={userForm.is_active} onChange={e => setUserForm({...userForm, is_active: e.target.checked})}
                      />
                      <label htmlFor="is_active" className="text-sm font-bold opacity-70">المستخدم نشط</label>
                    </div>
                    <button type="submit" className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4">
                      {editingUser ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}

          {showDefinitionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--app-bg)] w-full max-w-md p-8 border border-[#141414]/10 shadow-2xl relative"
              >
                <button onClick={() => setShowDefinitionModal(false)} className="absolute top-4 left-4 opacity-50 hover:opacity-100"><X size={20} /></button>
                <h2 className="text-2xl font-sans font-bold mb-6">إضافة تعريف جديد</h2>
                <form onSubmit={handleDefinitionSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الاسم</label>
                    <input 
                      type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={definitionForm.name || ''} onChange={e => setDefinitionForm({...definitionForm, name: e.target.value})}
                    />
                  </div>
                  {definitionForm.type === 'tax_types' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">النسبة (%)</label>
                      <input 
                        type="number" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={definitionForm.rate || 0} onChange={e => setDefinitionForm({...definitionForm, rate: Number(e.target.value)})}
                      />
                    </div>
                  )}
                  {definitionForm.type === 'currencies' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">الكود (مثلاً USD)</label>
                        <input 
                          type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                          value={definitionForm.code || ''} onChange={e => setDefinitionForm({...definitionForm, code: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">الرمز (مثلاً $)</label>
                        <input 
                          type="text" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                          value={definitionForm.symbol || ''} onChange={e => setDefinitionForm({...definitionForm, symbol: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {definitionForm.type === 'cost_centers' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">كود المركز</label>
                      <input 
                        type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={definitionForm.code || ''} onChange={e => setDefinitionForm({...definitionForm, code: e.target.value})}
                      />
                    </div>
                  )}

                  {(definitionForm.type === 'projects' || definitionForm.type === 'branches') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الكود</label>
                      <input 
                        type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={definitionForm.code || ''} onChange={e => setDefinitionForm({...definitionForm, code: e.target.value})}
                      />
                    </div>
                  )}

                  {definitionForm.type === 'models' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الماركة</label>
                      <select 
                        required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={definitionForm.brand_id || ''} onChange={e => setDefinitionForm({...definitionForm, brand_id: e.target.value})}
                      >
                        <option value="">اختر الماركة</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(definitionForm.type === 'sales_reps' || definitionForm.type === 'shipping_cos') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">رقم الهاتف</label>
                        <input 
                          type="text" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                          value={definitionForm.phone || ''} onChange={e => setDefinitionForm({...definitionForm, phone: e.target.value})}
                        />
                      </div>
                      {definitionForm.type === 'sales_reps' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-50">نسبة العموله %</label>
                          <input 
                            type="number" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                            value={definitionForm.commission_percent || 0} onChange={e => setDefinitionForm({...definitionForm, commission_percent: Number(e.target.value)})}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الوصف</label>
                    <textarea 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm h-20" 
                      value={definitionForm.description || ''} onChange={e => setDefinitionForm({...definitionForm, description: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4">حفظ التعريف</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showJournalModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--app-card-bg)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#141414]/10">
                <div className="p-6 border-b border-[#141414]/10 flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
                  <h2 className="text-xl font-sans font-bold flex items-center gap-2"><ClipboardList size={24} /> قيد يومية يدوي</h2>
                  <button onClick={() => setShowJournalModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleJournalSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase opacity-50 tracking-widest">التاريخ</label>
                      <input type="date" value={journalForm.date || ''} onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })} className="w-full bg-[#141414]/5 border border-[#141414]/10 p-3 text-sm focus:outline-none focus:border-[#141414] transition-colors" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase opacity-50 tracking-widest">البيان / الوصف</label>
                      <input type="text" value={journalForm.description || ''} onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })} className="w-full bg-[#141414]/5 border border-[#141414]/10 p-3 text-sm focus:outline-none focus:border-[#141414] transition-colors" placeholder="وصف القيد..." required />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold opacity-70">بنود القيد</h3>
                      <button type="button" onClick={() => setJournalForm({ ...journalForm, lines: [...journalForm.lines, { account_id: '', debit: 0, credit: 0 }] })} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><Plus size={14} /> إضافة سطر</button>
                    </div>
                    <div className="border border-[#141414]/10 overflow-hidden">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                            <th className="p-3 text-[10px] font-bold uppercase opacity-50">الحساب</th>
                            <th className="p-3 text-[10px] font-bold uppercase opacity-50 text-left">مدين</th>
                            <th className="p-3 text-[10px] font-bold uppercase opacity-50 text-left">دائن</th>
                            <th className="p-3 text-[10px] font-bold uppercase opacity-50 text-center">حذف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]/5">
                          {journalForm.lines.map((line: any, idx: number) => (
                            <tr key={idx}>
                              <td className="p-2">
                                <select value={line.account_id || ''} onChange={(e) => {
                                  const newLines = [...journalForm.lines];
                                  newLines[idx].account_id = e.target.value;
                                  setJournalForm({ ...journalForm, lines: newLines });
                                }} className="w-full bg-transparent border-none p-1 text-sm focus:outline-none" required>
                                  <option value="">اختر الحساب...</option>
                                  {chartOfAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input type="number" step="0.01" value={line.debit || 0} onChange={(e) => {
                                  const newLines = [...journalForm.lines];
                                  newLines[idx].debit = Number(e.target.value);
                                  if (newLines[idx].debit > 0) newLines[idx].credit = 0;
                                  setJournalForm({ ...journalForm, lines: newLines });
                                }} className="w-full bg-transparent border-none p-1 text-sm text-left font-mono focus:outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" step="0.01" value={line.credit || 0} onChange={(e) => {
                                  const newLines = [...journalForm.lines];
                                  newLines[idx].credit = Number(e.target.value);
                                  if (newLines[idx].credit > 0) newLines[idx].debit = 0;
                                  setJournalForm({ ...journalForm, lines: newLines });
                                }} className="w-full bg-transparent border-none p-1 text-sm text-left font-mono focus:outline-none" />
                              </td>
                              <td className="p-2 text-center">
                                <button type="button" onClick={() => {
                                  if (journalForm.lines.length <= 2) return;
                                  const newLines = journalForm.lines.filter((_: any, i: number) => i !== idx);
                                  setJournalForm({ ...journalForm, lines: newLines });
                                }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#141414]/5 font-bold">
                            <td className="p-3 text-sm">الإجمالي</td>
                            <td className="p-3 text-sm text-left font-mono">{journalForm.lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0).toLocaleString()}</td>
                            <td className="p-3 text-sm text-left font-mono">{journalForm.lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0).toLocaleString()}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {Math.abs(journalForm.lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) - journalForm.lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0)) > 0.01 && (
                      <p className="text-xs text-red-600 font-bold">الفرق: {Math.abs(journalForm.lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) - journalForm.lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0)).toLocaleString()}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-[#141414]/10">
                    <button type="button" onClick={() => setShowJournalModal(false)} className="px-6 py-2 border border-[#141414]/10 text-sm font-bold hover:bg-[#141414]/5 transition-colors">إلغاء</button>
                    <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-[#141414] text-[#E4E3E0] text-sm font-bold hover:bg-[#141414]/90 transition-colors disabled:opacity-50">حفظ القيد</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showFinancialDocModal && (
            <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#F5F5F3] w-full max-w-2xl p-8 rounded-sm shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowFinancialDocModal(false)}
                  className="absolute top-8 left-8 p-2 hover:bg-[#141414]/5 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="mb-8">
                  <h2 className="text-2xl font-sans font-bold tracking-tight">
                    {financialDocForm.type === 'receipt' ? 'سند قبض جديد' : 
                     financialDocForm.type === 'payment' ? 'سند صرف جديد' : 
                     financialDocForm.type === 'settlement' ? 'سند تسوية جديد' : 'شيك جديد'}
                  </h2>
                  <p className="text-xs opacity-50 uppercase font-bold tracking-widest mt-1">إضافة مستند مالي جديد للنظام</p>
                </div>

                <form onSubmit={handleFinancialDocSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">رقم السند</label>
                      <input 
                        type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={financialDocForm.number || ''} onChange={e => setFinancialDocForm({...financialDocForm, number: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">التاريخ</label>
                      <input 
                        type="date" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                        value={financialDocForm.date || ''} onChange={e => setFinancialDocForm({...financialDocForm, date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الطرف الثاني (عميل/مورد)</label>
                      <select 
                        required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={financialDocForm.party_id || ''} onChange={e => setFinancialDocForm({...financialDocForm, party_id: e.target.value})}
                      >
                        <option value="">اختر الطرف</option>
                        {suppliersCustomers.map(sc => (
                          <option key={sc.id} value={sc.id}>{sc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">الحساب (صندوق/بنك)</label>
                      <select 
                        required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={financialDocForm.account_id || ''} onChange={e => setFinancialDocForm({...financialDocForm, account_id: e.target.value})}
                      >
                        <option value="">اختر الحساب</option>
                        {bankAccounts.map(ba => (
                          <option key={ba.id} value={ba.id}>{ba.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">المبلغ</label>
                      <input 
                        type="number" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm font-mono font-bold" 
                        value={financialDocForm.amount || 0} onChange={e => setFinancialDocForm({...financialDocForm, amount: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">العملة</label>
                      <select 
                        required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={financialDocForm.currency_id || ''} onChange={e => setFinancialDocForm({...financialDocForm, currency_id: e.target.value})}
                      >
                        <option value="">اختر العملة</option>
                        {currencies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">سعر الصرف</label>
                      <input 
                        type="number" step="0.0001" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm font-mono" 
                        value={financialDocForm.exchange_rate || 1} onChange={e => setFinancialDocForm({...financialDocForm, exchange_rate: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">مركز التكلفة</label>
                      <select 
                        className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={financialDocForm.cost_center_id || ''} onChange={e => setFinancialDocForm({...financialDocForm, cost_center_id: e.target.value})}
                      >
                        <option value="">اختر مركز التكلفة</option>
                        {costCenters.map(cc => (
                          <option key={cc.id} value={cc.id}>{cc.name}</option>
                        ))}
                      </select>
                    </div>
                    {financialDocForm.type === 'check' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">تاريخ الاستحقاق</label>
                        <input 
                          type="date" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                          value={financialDocForm.due_date || ''} onChange={e => setFinancialDocForm({...financialDocForm, due_date: e.target.value})}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">ملاحظات</label>
                    <textarea 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm h-20" 
                      value={financialDocForm.notes || ''} onChange={e => setFinancialDocForm({...financialDocForm, notes: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (financialDocForm.id ? 'تحديث المستند' : 'حفظ المستند')}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBankAccountModal && (
            <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#F5F5F3] w-full max-w-md p-8 rounded-sm shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowBankAccountModal(false)}
                  className="absolute top-8 left-8 p-2 hover:bg-[#141414]/5 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="mb-8">
                  <h2 className="text-2xl font-sans font-bold tracking-tight">إضافة حساب بنكي / خزينة</h2>
                  <p className="text-xs opacity-50 uppercase font-bold tracking-widest mt-1">تعريف حساب مالي جديد في النظام</p>
                </div>

                <form onSubmit={handleBankAccountSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">اسم الحساب</label>
                    <input 
                      type="text" required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={bankAccountForm.name || ''} onChange={e => setBankAccountForm({...bankAccountForm, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">النوع</label>
                      <select 
                        className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={bankAccountForm.type || ''} onChange={e => setBankAccountForm({...bankAccountForm, type: e.target.value})}
                      >
                        <option value="cash">خزينة نقدي</option>
                        <option value="bank">حساب بنكي</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase opacity-50">العملة</label>
                      <select 
                        required className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm"
                        value={bankAccountForm.currency_id || ''} onChange={e => setBankAccountForm({...bankAccountForm, currency_id: e.target.value})}
                      >
                        <option value="">اختر العملة</option>
                        {currencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {bankAccountForm.type === 'bank' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">اسم البنك</label>
                        <input 
                          type="text" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                          value={bankAccountForm.bank_name || ''} onChange={e => setBankAccountForm({...bankAccountForm, bank_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-50">رقم الحساب</label>
                        <input 
                          type="text" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                          value={bankAccountForm.account_number || ''} onChange={e => setBankAccountForm({...bankAccountForm, account_number: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الحساب المرتبط</label>
                    <select 
                      className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm" 
                      value={bankAccountForm.account_id || ''} onChange={e => setBankAccountForm({...bankAccountForm, account_id: e.target.value})}
                    >
                      <option value="">اختر الحساب</option>
                      {chartOfAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase opacity-50">الرصيد الافتتاحي</label>
                    <input 
                      type="number" className="w-full p-3 bg-[#141414]/5 border-none rounded-sm text-sm font-mono" 
                      value={bankAccountForm.initial_balance || 0} onChange={e => setBankAccountForm({...bankAccountForm, initial_balance: Number(e.target.value)})}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : 'حفظ الحساب'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* AI Assistant */}
        <div className="fixed bottom-8 left-8 z-50">
          <AnimatePresence>
            {isAiOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-80 h-[450px] mb-4 shadow-2xl border border-[#141414]/10 flex flex-col overflow-hidden"
              >
                <div className="p-4 bg-[#141414] text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-400" />
                    <span className="text-xs font-bold uppercase">المساعد المالي الذكي</span>
                  </div>
                  <button onClick={() => setIsAiOpen(false)}><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F3]">
                  {aiMessages.length === 0 && (
                    <div className="text-center py-8 space-y-2">
                      <MessageSquare size={32} className="mx-auto opacity-20" />
                      <p className="text-[10px] font-bold uppercase opacity-50">كيف يمكنني مساعدتك اليوم؟</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={cn(
                      "max-w-[85%] p-3 rounded-sm text-xs leading-relaxed",
                      msg.role === 'user' ? "bg-[#141414] text-white mr-auto" : "bg-white border border-[#141414]/10 ml-auto"
                    )}>
                      {msg.text}
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="bg-white border border-[#141414]/10 p-3 rounded-sm ml-auto max-w-[85%]">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-[#141414] rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-[#141414] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-[#141414] rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleAiSubmit} className="p-4 bg-white border-t border-[#141414]/10 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="اسألني عن مبيعاتك..."
                    className="flex-1 bg-[#141414]/5 border-none p-2 text-xs rounded-sm focus:ring-0"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                  />
                  <button type="submit" className="p-2 bg-[#141414] text-white rounded-sm">
                    <Send size={14} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="w-14 h-14 bg-[#141414] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Sparkles size={24} className="text-orange-400" />
          </button>
        </div>

        {/* Header */}
        <header className="h-20 bg-[#F5F5F3]/80 backdrop-blur-md border-b border-[#141414]/10 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#141414]/5 rounded-sm lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
              <input 
                type="text" 
                placeholder="بحث في المنتجات، الفواتير، أو السجلات..." 
                className="w-full bg-[#141414]/5 border-none focus:ring-1 focus:ring-[#141414] py-2 pr-10 pl-4 text-sm rounded-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase opacity-50">التاريخ اليوم</p>
                <p className="text-xs font-bold">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-[#141414]/10" />
            
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold">{currentUser?.username || 'المسؤول'}</p>
                  <p className="text-[10px] opacity-50 uppercase">{currentUser?.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</p>
                </div>
                <div className="w-10 h-10 bg-[#141414] text-white flex items-center justify-center rounded-sm font-bold">
                  {(currentUser?.username || 'A')[0].toUpperCase()}
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-white border border-[#141414]/10 shadow-xl z-50 p-2"
                  >
                    <button 
                      onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                      className="w-full text-right p-3 text-xs font-bold hover:bg-[#141414]/5 flex items-center gap-2"
                    >
                      <Settings size={14} /> الإعدادات
                    </button>
                    <button 
                      onClick={() => { handleLogout(); setShowUserMenu(false); }}
                      className="w-full text-right p-3 text-xs font-bold hover:bg-[#141414]/5 flex items-center gap-2 text-red-600"
                    >
                      <LogOut size={14} /> تسجيل الخروج
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-12 max-w-[1600px] mx-auto w-full custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-sans font-black tracking-tighter uppercase">نظرة عامة</h2>
                    <p className="text-sm opacity-50">ملخص النشاط المالي وحركة المخزون اليوم.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[var(--app-card-bg)] border border-[#141414]/10 text-xs font-bold flex items-center gap-2 hover:bg-[#141414]/5">
                      <Download size={14} /> تصدير التقرير
                    </button>
                    <button 
                      onClick={() => openNewTransaction('sale')}
                      className="px-4 py-2 bg-[#141414] text-[#E4E3E0] text-xs font-bold flex items-center gap-2 hover:bg-[#141414]/90"
                    >
                      <Plus size={14} /> فاتورة جديدة
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ج.م`} icon={TrendingUp} trend="+12.5%" color="bg-blue-600" />
                  <StatCard title="إجمالي المشتريات" value={`${stats.totalPurchases.toLocaleString()} ج.م`} icon={ShoppingCart} trend="-2.4%" color="bg-orange-600" />
                  <StatCard title="قيمة المخزون" value={`${stats.inventoryValue.toLocaleString()} ج.م`} icon={Package} color="bg-purple-600" />
                  <StatCard title="الرصيد النقدي" value={`${stats.cashBalance.toLocaleString()} ج.م`} icon={Wallet} trend="+5.1%" color="bg-green-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-[var(--app-card-bg)] border border-[#141414]/10 p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-sans font-bold text-lg">آخر العمليات</h3>
                      <button className="text-xs font-bold opacity-50 hover:opacity-100 flex items-center gap-1">
                        عرض الكل <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {transactions.slice(0, 5).map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-[#141414]/5 hover:bg-[#141414]/10 transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-full",
                              t.type.includes('sale') ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            )}>
                              {t.type.includes('sale') ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{t.party_name || 'عميل نقدي'}</p>
                              <p className="text-[10px] opacity-50 uppercase">{t.type === 'sale' ? 'مبيعات' : t.type === 'purchase' ? 'مشتريات' : 'مردودات'}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-mono font-bold">{t.total_amount.toLocaleString()} ج.م</p>
                            <p className="text-[10px] opacity-50">{t.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8">
                    <h3 className="font-sans font-bold text-lg mb-8">حالة المخزون</h3>
                    <div className="space-y-6">
                      {products.slice(0, 4).map(p => (
                        <div key={p.id} className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold">{p.name}</span>
                            <span className="opacity-50">{p.quantity} {p.unit}</span>
                          </div>
                          <div className="h-1.5 bg-[#141414]/5 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                p.quantity <= p.min_stock ? "bg-red-500" : "bg-[#141414]"
                              )} 
                              style={{ width: `${Math.min((p.quantity / (p.min_stock * 3)) * 100, 100)}%` }}
                            />
                          </div>
                          {p.quantity <= p.min_stock && (
                            <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                              <AlertCircle size={10} /> مخزون منخفض!
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'inventory_mgmt' && (
              <motion.div
                key="inventory_mgmt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">إدارة المخزون</h2>
                    <p className="text-sm opacity-50">إدارة المنتجات، الفئات، الوحدات والمجموعات المخزنية.</p>
                  </div>
                  <div className="flex gap-2">
                    {inventoryMgmtSubTab === 'products' && (
                      <button 
                        onClick={() => { 
                          setEditingProduct(null); 
                          setProductForm({ 
                            name: '', 
                            name_en: '',
                            sku: '', 
                            barcode: '',
                            electronic_invoice_code: '',
                            coding_type: 'GS1',
                            is_assembly: false,
                            is_service: false,
                            has_expiry: false,
                            has_serial: false,
                            stop_sale: false,
                            stop_purchase: false,
                            concrete_type: 'normal',
                            part_numbers: ['', '', '', '', '', ''],
                            additional_statement: '',
                            no_points: false,
                            no_discount: false,
                            for_rent: false,
                            category: '', 
                            categories: [],
                            group_id: '',
                            groups: [],
                            unit: 'قطعة', 
                            quantity: 0, 
                            cost_price: 0, 
                            sale_price: 0, 
                            min_stock: 0, 
                            warehouse_id: '',
                            is_active: true
                          }); 
                          setShowProductModal(true); 
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إضافة منتج
                      </button>
                    )}
                    {(inventoryMgmtSubTab === 'categories' || inventoryMgmtSubTab === 'units' || inventoryMgmtSubTab === 'groups') && (
                      <button 
                        onClick={() => { 
                          const type = inventoryMgmtSubTab === 'categories' ? 'product_categories' : 
                                       inventoryMgmtSubTab === 'units' ? 'product_units' : 'product_groups';
                          setDefinitionForm({ type: type as any, name: '', description: '' }); 
                          setShowDefinitionModal(true); 
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إضافة جديد
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-navigation */}
                <div className="flex border-b border-[#141414]/10 gap-8">
                  <SubTabButton label="المنتجات" active={inventoryMgmtSubTab === 'products'} onClick={() => setInventoryMgmtSubTab('products')} />
                  <SubTabButton label="الفئات" active={inventoryMgmtSubTab === 'categories'} onClick={() => setInventoryMgmtSubTab('categories')} />
                  <SubTabButton label="الوحدات" active={inventoryMgmtSubTab === 'units'} onClick={() => setInventoryMgmtSubTab('units')} />
                  <SubTabButton label="المجموعات" active={inventoryMgmtSubTab === 'groups'} onClick={() => setInventoryMgmtSubTab('groups')} />
                </div>

                {inventoryMgmtSubTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex gap-4 bg-[var(--app-card-bg)] border border-[#141414]/10 p-4">
                      <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                        <input 
                          type="text" 
                          placeholder="بحث باسم الصنف، الكود، أو الباركود..."
                          className="w-full pr-10 pl-4 py-2 bg-[#141414]/5 border-none rounded-sm text-sm outline-none focus:bg-[#141414]/10 transition-colors"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="bg-[var(--app-card-bg)] border border-[#141414]/10">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right">
                          <thead>
                            <tr className="border-b border-[#141414]/10 text-[10px] font-sans font-bold uppercase opacity-50">
                              <th className="p-4">المنتج</th>
                              <th className="p-4">SKU</th>
                              <th className="p-4">الفئة</th>
                              <th className="p-4">المجموعة</th>
                              <th className="p-4">الكمية</th>
                              <th className="p-4">سعر التكلفة</th>
                              <th className="p-4">سعر البيع</th>
                              <th className="p-4">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#141414]/5">
                            {filteredProducts.map((p) => (
                              <tr key={p.id} className="hover:bg-[#141414]/5 transition-colors group">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#141414]/5 flex items-center justify-center rounded-sm">
                                      <Package size={16} />
                                    </div>
                                    <span className="text-sm font-bold">{p.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-xs font-mono opacity-50">{p.sku}</td>
                                <td className="p-4 text-xs">{p.category}</td>
                                <td className="p-4 text-xs">{p.group_id ? productGroups.find(g => g.id === p.group_id)?.name : '---'}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <span className={cn("text-sm font-bold", p.quantity <= p.min_stock ? "text-red-500" : "")}>{p.quantity}</span>
                                    <span className="text-[10px] opacity-50 uppercase">{p.unit}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-sm font-mono">{p.cost_price.toLocaleString()} ج.م</td>
                                <td className="p-4 text-sm font-mono font-bold">{p.sale_price.toLocaleString()} ج.م</td>
                                <td className="p-4">
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingProduct(p); setProductForm(p); setShowProductModal(true); }} className="p-1 hover:bg-[#141414]/10 rounded"><Edit size={14} /></button>
                                    <button onClick={() => handleProductDelete(p.id)} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {inventoryMgmtSubTab === 'categories' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {productCategories.map(c => (
                      <div key={c.id} className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 flex justify-between items-center group">
                        <div>
                          <h3 className="font-sans font-bold text-lg">{c.name}</h3>
                          <p className="text-xs opacity-50">{products.filter(p => p.category === c.name).length} منتج</p>
                        </div>
                        <button onClick={() => handleDefinitionDelete('product_categories', c.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {inventoryMgmtSubTab === 'units' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {productUnits.map(u => (
                      <div key={u.id} className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 flex justify-between items-center group">
                        <div>
                          <h3 className="font-sans font-bold text-lg">{u.name}</h3>
                          <p className="text-xs opacity-50">{u.description || 'لا يوجد وصف'}</p>
                        </div>
                        <button onClick={() => handleDefinitionDelete('product_units', u.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {inventoryMgmtSubTab === 'groups' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-sans font-bold">المجموعات المخزنية</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'product_groups', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="px-4 py-2 bg-[#141414] text-white text-xs font-bold flex items-center gap-2"
                      >
                        <Plus size={14} /> إضافة مجموعة جديدة
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {productGroups.map(g => (
                        <div key={g.id} className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 flex justify-between items-center group">
                          <div>
                            <h3 className="font-sans font-bold text-lg">{g.name}</h3>
                            <p className="text-xs opacity-50">{products.filter(p => p.group_id === g.id).length} منتج</p>
                          </div>
                          <button onClick={() => handleDefinitionDelete('product_groups', g.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={16} /></button>
                        </div>
                      ))}
                      {productGroups.length === 0 && (
                        <div className="col-span-full p-12 border-2 border-dashed border-[#141414]/10 flex flex-col items-center justify-center opacity-50">
                          <TrendingUp size={48} className="mb-4" />
                          <p className="font-bold">لا توجد مجموعات مخزنية حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'stock_movements' && (
              <motion.div
                key="stock_movements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">حركة المخزون</h2>
                    <p className="text-sm opacity-50">تتبع حركة البضائع بين المستودعات والتسويات الجردية.</p>
                  </div>
                  <div className="flex gap-2">
                    {stockMovementsSubTab === 'transfers' && (
                      <button 
                        onClick={() => { setTransferForm({ date: new Date().toISOString().split('T')[0], from_warehouse_id: '', to_warehouse_id: '', items: [{ product_id: '', quantity: 1 }], notes: '' }); setShowTransferModal(true); }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> تحويل جديد
                      </button>
                    )}
                    {stockMovementsSubTab === 'issuance' && (
                      <button 
                        onClick={() => { setStockAdjustmentForm({ type: 'out', date: new Date().toISOString().split('T')[0], warehouse_id: '', reason: 'صرف مخزني', items: [{ product_id: '', quantity: 1 }], notes: '' }); setShowAdjustmentModal(true); }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إذن صرف جديد
                      </button>
                    )}
                    {stockMovementsSubTab === 'receipt' && (
                      <button 
                        onClick={() => { setStockAdjustmentForm({ type: 'in', date: new Date().toISOString().split('T')[0], warehouse_id: '', reason: 'استلام مخزني', items: [{ product_id: '', quantity: 1 }], notes: '' }); setShowAdjustmentModal(true); }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إذن استلام جديد
                      </button>
                    )}
                    {stockMovementsSubTab === 'adjustments' && (
                      <button 
                        onClick={() => {
                          setStockAdjustmentForm({
                            type: 'adjustment',
                            warehouse_id: '',
                            date: new Date().toISOString().split('T')[0],
                            reason: 'تسوية جردية',
                            items: [{ product_id: '', quantity: 1 }],
                            notes: ''
                          });
                          setShowAdjustmentModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> تسوية جردية جديدة
                      </button>
                    )}
                    {stockMovementsSubTab === 'warehouses' && (
                      <button 
                        onClick={() => { setWarehouseForm({ name: '', location: '', is_default: false }); setShowWarehouseModal(true); }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إضافة مستودع
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-navigation */}
                <div className="flex border-b border-[#141414]/10 gap-8">
                  <SubTabButton label="سجل الحركات" active={stockMovementsSubTab === 'log'} onClick={() => setStockMovementsSubTab('log')} />
                  <SubTabButton label="التحويلات" active={stockMovementsSubTab === 'transfers'} onClick={() => setStockMovementsSubTab('transfers')} />
                  <SubTabButton label="أذونات الصرف" active={stockMovementsSubTab === 'issuance'} onClick={() => setStockMovementsSubTab('issuance')} />
                  <SubTabButton label="أذونات الاستلام" active={stockMovementsSubTab === 'receipt'} onClick={() => setStockMovementsSubTab('receipt')} />
                  <SubTabButton label="المستودعات" active={stockMovementsSubTab === 'warehouses'} onClick={() => setStockMovementsSubTab('warehouses')} />
                  <SubTabButton label="التسويات" active={stockMovementsSubTab === 'adjustments'} onClick={() => setStockMovementsSubTab('adjustments')} />
                </div>

                {stockMovementsSubTab === 'log' && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b border-[#141414]/10 text-[10px] font-sans font-bold uppercase opacity-50">
                            <th className="p-4">المنتج</th>
                            <th className="p-4">النوع</th>
                            <th className="p-4">من</th>
                            <th className="p-4">إلى</th>
                            <th className="p-4">الكمية</th>
                            <th className="p-4">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]/5">
                          {stockMovements.map((m: any) => (
                            <tr key={m.id} className="hover:bg-[#141414]/5 transition-colors">
                              <td className="p-4 text-sm font-bold">{m.product_name}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] font-bold rounded-sm",
                                  m.type === 'transfer' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                )}>
                                  {m.type === 'transfer' ? 'تحويل' : 'تسوية'}
                                </span>
                              </td>
                              <td className="p-4 text-xs opacity-50">{m.from_warehouse_name || '-'}</td>
                              <td className="p-4 text-xs opacity-50">{m.to_warehouse_name || '-'}</td>
                              <td className="p-4 font-mono text-sm font-bold">{m.quantity}</td>
                              <td className="p-4 text-xs opacity-50">{new Date(m.date).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {stockMovementsSubTab === 'warehouses' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {warehouses.map((w: any) => (
                      <div key={w.id} className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-[#141414]/5 flex items-center justify-center rounded-sm">
                            <ShieldCheck size={24} />
                          </div>
                          {w.is_default && (
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-sm">افتراضي</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-sans font-bold text-lg">{w.name}</h3>
                          <p className="text-xs opacity-50">{w.location}</p>
                        </div>
                        <div className="pt-4 border-t border-[#141414]/5 flex justify-between items-center">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setWarehouseForm(w);
                                setShowWarehouseModal(true);
                              }}
                              className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteWarehouse(w.id)}
                              className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-bold uppercase opacity-50">إجمالي الأصناف</p>
                            <p className="text-sm font-bold">{products.filter(p => p.warehouse_id === w.id).length}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {stockMovementsSubTab === 'transfers' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          setTransferForm({
                            from_warehouse_id: '',
                            to_warehouse_id: '',
                            date: new Date().toISOString().split('T')[0],
                            items: [{ product_id: '', quantity: 1 }],
                            notes: ''
                          });
                          setShowTransferModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold flex items-center gap-2"
                      >
                        <Plus size={14} /> تحويل مخزني جديد
                      </button>
                    </div>
                    <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">من مستودع</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">إلى مستودع</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">عدد الأصناف</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">ملاحظات</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {transfers.map((t) => (
                          <tr key={t.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs opacity-50">{t.date}</td>
                            <td className="p-4 text-sm font-bold">{warehouses.find(w => w.id === t.from_warehouse_id)?.name || '---'}</td>
                            <td className="p-4 text-sm font-bold">{warehouses.find(w => w.id === t.to_warehouse_id)?.name || '---'}</td>
                            <td className="p-4 text-xs font-mono font-bold">{t.items.length} صنف</td>
                            <td className="p-4 text-xs opacity-50">{t.notes || '---'}</td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleEditTransfer(t)} className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteTransfer(t.id)} className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {(stockMovementsSubTab === 'issuance' || stockMovementsSubTab === 'receipt') && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          setStockAdjustmentForm({
                            type: stockMovementsSubTab === 'issuance' ? 'out' : 'in',
                            warehouse_id: '',
                            date: new Date().toISOString().split('T')[0],
                            reason: '',
                            items: [{ product_id: '', quantity: 1 }],
                            notes: ''
                          });
                          setShowAdjustmentModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white text-xs font-bold flex items-center gap-2"
                      >
                        <Plus size={14} /> {stockMovementsSubTab === 'issuance' ? 'إذن صرف جديد' : 'إذن إضافة جديد'}
                      </button>
                    </div>
                    <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">المستودع</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">السبب</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">عدد الأصناف</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">ملاحظات</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {adjustments.filter(a => a.type === (stockMovementsSubTab === 'issuance' ? 'out' : 'in')).map((a) => (
                          <tr key={a.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs opacity-50">{a.date}</td>
                            <td className="p-4 text-sm font-bold">{warehouses.find(w => w.id === a.warehouse_id)?.name || '---'}</td>
                            <td className="p-4 text-sm font-bold">{a.reason}</td>
                            <td className="p-4 text-xs font-mono font-bold">{a.items.length} صنف</td>
                            <td className="p-4 text-xs opacity-50">{a.notes || '---'}</td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleEditAdjustment(a)} className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteAdjustment(a.id)} className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {stockMovementsSubTab === 'adjustments' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          setStockAdjustmentForm({
                            type: 'adjustment',
                            warehouse_id: '',
                            date: new Date().toISOString().split('T')[0],
                            reason: 'تسوية جردية',
                            items: [{ product_id: '', quantity: 1 }],
                            notes: ''
                          });
                          setShowAdjustmentModal(true);
                        }}
                        className="px-4 py-2 bg-orange-600 text-white text-xs font-bold flex items-center gap-2"
                      >
                        <Plus size={14} /> إضافة تسوية جردية جديدة
                      </button>
                    </div>
                    <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">المستودع</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">السبب</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">عدد الأصناف</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">ملاحظات</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {adjustments.filter(a => a.type === 'adjustment').map((a) => (
                          <tr key={a.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs opacity-50">{a.date}</td>
                            <td className="p-4 text-sm font-bold">{warehouses.find(w => w.id === a.warehouse_id)?.name || '---'}</td>
                            <td className="p-4 text-sm font-bold">{a.reason}</td>
                            <td className="p-4 text-xs font-mono font-bold">{a.items.length} صنف</td>
                            <td className="p-4 text-xs opacity-50">{a.notes || '---'}</td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleEditAdjustment(a)} className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteAdjustment(a.id)} className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {adjustments.filter(a => a.type === 'adjustment').length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-12 text-center opacity-50">لا توجد تسويات جردية حالياً. يرجى استخدام زر الإضافة لبدء تسوية جردية جديدة.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}
              </motion.div>
            )}




            {activeTab === 'sales' && (
              <motion.div
                key="sales"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">المبيعات والمشتريات</h2>
                    <p className="text-sm opacity-50">إدارة الفواتير، عروض الأسعار، وبيانات الموردين والعملاء.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative ml-4">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                      <input 
                        type="text" 
                        placeholder="بحث في الفواتير..." 
                        className="p-2 pr-10 border border-[#141414]/10 text-sm focus:outline-none focus:border-[#141414]/30 w-64"
                        value={invoiceSearchQuery}
                        onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                      />
                    </div>
                    {salesSubTab === 'invoices' && (
                      <button 
                        onClick={() => openNewTransaction('sale')}
                        className="px-6 py-3 bg-green-600 text-white text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> فاتورة مبيعات
                      </button>
                    )}
                    {salesSubTab === 'returns' && (
                      <button 
                        onClick={() => openNewTransaction('sale_return')}
                        className="px-6 py-3 bg-red-600 text-white text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> مردودات مبيعات
                      </button>
                    )}
                    {salesSubTab === 'quotes' && (
                      <button 
                        onClick={() => {
                          setQuoteForm({
                            party_id: '',
                            date: new Date().toISOString().split('T')[0],
                            items: [{ product_id: '', quantity: 1, unit_price: 0 }],
                            notes: ''
                          });
                          setShowQuoteModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> عرض سعر جديد
                      </button>
                    )}
                    {salesSubTab === 'parties' && (
                      <button 
                        onClick={() => {
                          setSCForm({ type: 'customer', name: '', phone: '', email: '', balance: 0, group_id: '' });
                          setShowSCModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إضافة مورد/عميل
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-navigation */}
                <div className="flex border-b border-[#141414]/10 gap-8">
                  <SubTabButton label="الفواتير" active={salesSubTab === 'invoices'} onClick={() => setSalesSubTab('invoices')} />
                  <SubTabButton label="المردودات" active={salesSubTab === 'returns'} onClick={() => setSalesSubTab('returns')} />
                  <SubTabButton label="عروض الأسعار" active={salesSubTab === 'quotes'} onClick={() => setSalesSubTab('quotes')} />
                  <SubTabButton label="الموردين والعملاء" active={salesSubTab === 'parties'} onClick={() => setSalesSubTab('parties')} />
                </div>

                {(salesSubTab === 'invoices' || salesSubTab === 'returns') && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">رقم الفاتورة</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">النوع</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">الطرف الآخر</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-left">الإجمالي</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {transactions
                          .filter(t => salesSubTab === 'invoices' ? (t.type === 'sale' || t.type === 'purchase') : (t.type === 'sale_return' || t.type === 'purchase_return'))
                          .filter(t => {
                            const partyName = suppliersCustomers.find(sc => sc.id === t.party_id)?.name || 'عميل نقدي';
                            return (t.document_number || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                                   partyName.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
                          })
                          .map((t) => (
                          <tr key={t.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs font-mono font-bold">{t.document_number || `INV-${t.id.slice(0, 8)}`}</td>
                            <td className="p-4 text-xs">
                              <span className={cn(
                                "px-2 py-0.5 rounded-sm font-bold",
                                t.type === 'sale' ? "bg-green-100 text-green-700" : 
                                t.type === 'purchase' ? "bg-orange-100 text-orange-700" :
                                t.type === 'sale_return' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                              )}>
                                {t.type === 'sale' ? 'مبيعات' : 
                                 t.type === 'purchase' ? 'مشتريات' :
                                 t.type === 'sale_return' ? 'مردودات مبيعات' : 'مردودات مشتريات'}
                              </span>
                            </td>
                            <td className="p-4 text-sm font-bold">{suppliersCustomers.find(sc => sc.id === t.party_id)?.name || 'عميل نقدي'}</td>
                            <td className="p-4 text-xs opacity-70">{t.date}</td>
                            <td className="p-4 text-sm font-mono font-bold text-left">
                              {t.total_amount?.toLocaleString() || 0} ج.م
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleViewJournalEntry(t.document_number || t.id)} className="p-1 hover:bg-[#141414]/5 text-purple-600 rounded transition-colors" title="قيد اليومية">
                                  <ClipboardList size={14} />
                                </button>
                                <button onClick={() => handlePrintTransaction(t)} className="p-1 hover:bg-[#141414]/5 text-gray-600 rounded transition-colors" title="طباعة">
                                  <Printer size={14} />
                                </button>
                                <button onClick={() => handleEditTransaction(t)} className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {transactions
                          .filter(t => salesSubTab === 'invoices' ? (t.type === 'sale' || t.type === 'purchase') : (t.type === 'sale_return' || t.type === 'purchase_return'))
                          .filter(t => {
                            const partyName = suppliersCustomers.find(sc => sc.id === t.party_id)?.name || 'عميل نقدي';
                            return (t.document_number || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                                   partyName.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
                          })
                          .length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-12 text-center opacity-50">لا توجد فواتير حالياً</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {salesSubTab === 'quotes' && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">رقم العرض</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">العميل</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-left">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {quotes.map((quote) => (
                          <tr key={quote.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs font-mono font-bold">Q-{quote.id.slice(0, 8)}</td>
                            <td className="p-4 text-sm font-bold">{suppliersCustomers.find(sc => sc.id === quote.party_id)?.name || 'عميل عام'}</td>
                            <td className="p-4 text-xs opacity-70">{quote.date}</td>
                            <td className="p-4 text-sm font-mono font-bold text-left">
                              {quote.total_amount?.toLocaleString() || 0} ج.م
                            </td>
                          </tr>
                        ))}
                        {quotes.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-12 text-center opacity-50">لا توجد عروض أسعار حالياً</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {salesSubTab === 'parties' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6">
                      <h3 className="font-sans font-bold text-lg mb-4">العملاء</h3>
                      <div className="space-y-3">
                        {suppliersCustomers.filter(sc => sc.type === 'customer').map(c => (
                          <div key={c.id} className="p-4 bg-[#141414]/5 flex justify-between items-center group">
                            <div>
                              <p className="font-bold text-sm">{c.name}</p>
                              <p className="text-[10px] opacity-50">{c.phone}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-left">
                                <p className={cn("text-xs font-bold", c.balance >= 0 ? "text-green-600" : "text-red-600")}>
                                  {c.balance?.toLocaleString() || 0} ج.م
                                </p>
                              </div>
                              <button 
                                onClick={() => {
                                  setSCForm(c);
                                  setShowSCModal(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#141414]/10 rounded transition-all"
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {suppliersCustomers.filter(sc => sc.type === 'customer').length === 0 && (
                          <p className="text-center py-8 opacity-50 text-xs">لا يوجد عملاء حالياً</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6">
                      <h3 className="font-sans font-bold text-lg mb-4">الموردين</h3>
                      <div className="space-y-3">
                        {suppliersCustomers.filter(sc => sc.type === 'supplier').map(s => (
                          <div key={s.id} className="p-4 bg-[#141414]/5 flex justify-between items-center group">
                            <div>
                              <p className="font-bold text-sm">{s.name}</p>
                              <p className="text-[10px] opacity-50">{s.phone}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-left">
                                <p className={cn("text-xs font-bold", s.balance >= 0 ? "text-green-600" : "text-red-600")}>
                                  {s.balance?.toLocaleString() || 0} ج.م
                                </p>
                              </div>
                              <button 
                                onClick={() => {
                                  setSCForm(s);
                                  setShowSCModal(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#141414]/10 rounded transition-all"
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {suppliersCustomers.filter(sc => sc.type === 'supplier').length === 0 && (
                          <p className="text-center py-8 opacity-50 text-xs">لا يوجد موردين حالياً</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'purchase' && (
              <motion.div
                key="purchase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">المشتريات</h2>
                    <p className="text-sm opacity-50">إدارة فواتير المشتريات، المردودات، وبيانات الموردين.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative ml-4">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                      <input 
                        type="text" 
                        placeholder="بحث في الفواتير..." 
                        className="p-2 pr-10 border border-[#141414]/10 text-sm focus:outline-none focus:border-[#141414]/30 w-64"
                        value={invoiceSearchQuery}
                        onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                      />
                    </div>
                    {purchaseSubTab === 'invoices' && (
                      <button 
                        onClick={() => openNewTransaction('purchase')}
                        className="px-6 py-3 bg-orange-600 text-white text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> فاتورة مشتريات
                      </button>
                    )}
                    {purchaseSubTab === 'returns' && (
                      <button 
                        onClick={() => openNewTransaction('purchase_return')}
                        className="px-6 py-3 bg-yellow-600 text-white text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> مردودات مشتريات
                      </button>
                    )}
                    {purchaseSubTab === 'suppliers' && (
                      <button 
                        onClick={() => {
                          setSCForm({ type: 'supplier', name: '', phone: '', email: '', balance: 0, group_id: '' });
                          setShowSCModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إضافة مورد
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-navigation */}
                <div className="flex border-b border-[#141414]/10 gap-8">
                  <SubTabButton label="الفواتير" active={purchaseSubTab === 'invoices'} onClick={() => setPurchaseSubTab('invoices')} />
                  <SubTabButton label="المردودات" active={purchaseSubTab === 'returns'} onClick={() => setPurchaseSubTab('returns')} />
                  <SubTabButton label="الموردين" active={purchaseSubTab === 'suppliers'} onClick={() => setPurchaseSubTab('suppliers')} />
                </div>

                {(purchaseSubTab === 'invoices' || purchaseSubTab === 'returns') && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">رقم الفاتورة</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">النوع</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">المورد</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-left">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {transactions
                          .filter(t => purchaseSubTab === 'invoices' ? (t.type === 'purchase') : (t.type === 'purchase_return'))
                          .filter(t => {
                            const partyName = suppliersCustomers.find(sc => sc.id === t.party_id)?.name || 'مورد نقدي';
                            return (t.document_number || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                                   partyName.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
                          })
                          .map((t) => (
                          <tr key={t.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs font-mono font-bold">{t.document_number || `INV-${t.id.slice(0, 8)}`}</td>
                            <td className="p-4 text-xs">
                              <span className={cn(
                                "px-2 py-0.5 rounded-sm font-bold",
                                t.type === 'purchase' ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                              )}>
                                {t.type === 'purchase' ? 'مشتريات' : 'مردودات مشتريات'}
                              </span>
                            </td>
                            <td className="p-4 text-sm font-bold">{suppliersCustomers.find(sc => sc.id === t.party_id)?.name || 'مورد نقدي'}</td>
                            <td className="p-4 text-xs opacity-70">{t.date}</td>
                            <td className="p-4 text-sm font-mono font-bold text-left">
                              {t.total_amount?.toLocaleString() || 0} ج.م
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleViewJournalEntry(t.document_number || t.id)} className="p-1 hover:bg-[#141414]/5 text-purple-600 rounded transition-colors" title="قيد اليومية">
                                  <ClipboardList size={14} />
                                </button>
                                <button onClick={() => handlePrintTransaction(t)} className="p-1 hover:bg-[#141414]/5 text-gray-600 rounded transition-colors" title="طباعة">
                                  <Printer size={14} />
                                </button>
                                <button onClick={() => handleEditTransaction(t)} className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {transactions
                          .filter(t => purchaseSubTab === 'invoices' ? (t.type === 'purchase') : (t.type === 'purchase_return'))
                          .filter(t => {
                            const partyName = suppliersCustomers.find(sc => sc.id === t.party_id)?.name || 'مورد نقدي';
                            return (t.document_number || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                                   partyName.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
                          })
                          .length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-12 text-center opacity-50">لا توجد فواتير حالياً</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {purchaseSubTab === 'suppliers' && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6">
                    <h3 className="font-sans font-bold text-lg mb-4">الموردين</h3>
                    <div className="space-y-3">
                      {suppliersCustomers.filter(sc => sc.type === 'supplier').map(s => (
                        <div key={s.id} className="p-4 bg-[#141414]/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className="text-[10px] opacity-50">{s.phone}</p>
                          </div>
                          <div className="text-left">
                            <p className={cn("text-xs font-bold", s.balance >= 0 ? "text-green-600" : "text-red-600")}>
                              {s.balance?.toLocaleString() || 0} ج.م
                            </p>
                          </div>
                        </div>
                      ))}
                      {suppliersCustomers.filter(sc => sc.type === 'supplier').length === 0 && (
                        <p className="text-center py-8 opacity-50 text-xs">لا يوجد موردين حالياً</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">التقارير والتحليلات</h2>
                    <p className="text-sm opacity-50">تحليل الأداء المالي وحركة المخزون بالفترات.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[#141414] text-white text-xs font-bold flex items-center gap-2">
                      <Download size={14} /> تصدير PDF
                    </button>
                  </div>
                </div>

                {/* Sub-navigation for Reports */}
                <div className="flex border-b border-[#141414]/10 gap-8 overflow-x-auto pb-2">
                  <SubTabButton label="لوحة المعلومات" active={reportsSubTab === 'dashboard'} onClick={() => setReportsSubTab('dashboard')} />
                  <div className="relative group">
                    <button 
                      className={cn(
                        "pb-4 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                        reportsSubTab === 'sales' ? "text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
                      )}
                      onClick={() => setReportsSubTab('sales')}
                    >
                      تقارير المبيعات
                    </button>
                    <div className="absolute top-full right-0 bg-white border border-[#141414]/10 shadow-xl py-2 min-w-[200px] z-10 hidden group-hover:block">
                      <button onClick={() => setActiveReport('تقرير مبيعات الأصناف')} className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">مبيعات الأصناف</button>
                      <button onClick={() => setActiveReport('تقرير مبيعات العملاء')} className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">مبيعات العملاء</button>
                      <button onClick={() => setActiveReport('تقرير مبيعات المناديب')} className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">مبيعات المندوبين</button>
                      <button onClick={() => setActiveReport('تقرير مرتجعات المبيعات')} className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">مرتجع مبيعات</button>
                    </div>
                  </div>
                  <div className="relative group">
                    <button 
                      className={cn(
                        "pb-4 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                        reportsSubTab === 'inventory' ? "text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
                      )}
                      onClick={() => setReportsSubTab('inventory')}
                    >
                      تقارير المخازن
                    </button>
                    <div className="absolute top-full right-0 bg-white border border-[#141414]/10 shadow-xl py-2 min-w-[200px] z-10 hidden group-hover:block">
                      <button onClick={() => setActiveReport('تقرير أرصدة المستودعات')} className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">أرصدة المخازن</button>
                      <button onClick={() => setActiveReport('تقرير حركة صنف')} className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">حركة صنف</button>
                      <button className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">الأصناف الراكدة</button>
                      <button className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">تنبيهات حد الطلب</button>
                    </div>
                  </div>
                  <div className="relative group">
                    <button 
                      className={cn(
                        "pb-4 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                        reportsSubTab === 'finance' ? "text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
                      )}
                      onClick={() => setReportsSubTab('finance')}
                    >
                      تقارير المالية
                    </button>
                    <div className="absolute top-full right-0 bg-white border border-[#141414]/10 shadow-xl py-2 min-w-[200px] z-10 hidden group-hover:block">
                      <button onClick={() => setActiveReport('كشف حساب تفصيلي')} className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">كشف حساب</button>
                      <button className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">ميزان المراجعة</button>
                      <button className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">قائمة الدخل</button>
                      <button className="w-full text-right px-4 py-2 text-xs hover:bg-[#141414]/5">الميزانية العمومية</button>
                    </div>
                  </div>
                </div>

                {reportsSubTab === 'dashboard' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      {/* Profit & Loss Chart */}
                      <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8">
                        <h3 className="text-xs font-bold uppercase mb-8">تحليل الأرباح والخسائر (شهرياً)</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={Array.isArray(profitLossReport) ? profitLossReport : []}>
                              <defs>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414" strokeOpacity={0.05} />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                              <Tooltip 
                                contentStyle={{backgroundColor: '#141414', border: 'none', borderRadius: '0', color: '#fff'}}
                                itemStyle={{color: '#fff', fontSize: '10px'}}
                              />
                              <Area type="monotone" dataKey="net_profit" stroke="#141414" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Trial Balance */}
                      <div className="bg-[var(--app-card-bg)] border border-[#141414]/10">
                        <div className="p-4 border-b border-[#141414]/10 bg-[#F5F5F3]">
                          <h3 className="text-xs font-bold uppercase">ميزان المراجعة</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right">
                            <thead>
                              <tr className="border-b border-[#141414]/10 text-[10px] font-bold uppercase opacity-50">
                                <th className="p-4">اسم الحساب</th>
                                <th className="p-4">مدين</th>
                                <th className="p-4">دائن</th>
                                <th className="p-4">الرصيد</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs divide-y divide-[#141414]/5">
                              {bankAccounts.map(acc => (
                                <tr key={acc.id}>
                                  <td className="p-4 font-bold">{acc.name}</td>
                                  <td className="p-4 font-mono">{acc.balance > 0 ? acc.balance.toLocaleString() : 0}</td>
                                  <td className="p-4 font-mono">{acc.balance < 0 ? Math.abs(acc.balance).toLocaleString() : 0}</td>
                                  <td className="p-4 font-mono font-bold">{acc.balance.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="p-4 font-bold">المخزون السلعي</td>
                                <td className="p-4 font-mono">{stats.inventoryValue.toLocaleString()}</td>
                                <td className="p-4 font-mono">0</td>
                                <td className="p-4 font-mono font-bold">{stats.inventoryValue.toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Balance Sheet Summary */}
                      <div className="bg-[#141414] text-white p-8 space-y-8">
                        <h3 className="text-xs font-bold uppercase opacity-50">ملخص الميزانية العمومية</h3>
                        <div className="space-y-6">
                          <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase opacity-50">إجمالي الأصول</p>
                              <h4 className="text-2xl font-mono font-bold">{(stats.cashBalance + stats.inventoryValue).toLocaleString()}</h4>
                            </div>
                            <TrendingUp className="text-green-400" size={24} />
                          </div>
                          <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase opacity-50">إجمالي الالتزامات</p>
                              <h4 className="text-2xl font-mono font-bold">0</h4>
                            </div>
                            <TrendingDown className="text-red-400 opacity-20" size={24} />
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-bold uppercase opacity-50">حقوق الملكية</p>
                              <h4 className="text-2xl font-mono font-bold">{(stats.cashBalance + stats.inventoryValue).toLocaleString()}</h4>
                            </div>
                            <Sparkles className="text-orange-400" size={24} />
                          </div>
                        </div>
                        <p className="text-[10px] leading-relaxed opacity-50">
                          هذا الملخص يعتمد على البيانات الحالية في النظام ويشمل النقدية في البنوك وقيمة المخزون المقدرة.
                        </p>
                      </div>

                      {/* Inventory Stats */}
                      <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8 space-y-6">
                        <h3 className="text-xs font-bold uppercase">إحصائيات المخزون</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs opacity-70">عدد الأصناف</span>
                            <span className="text-sm font-bold font-mono">{products.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs opacity-70">أصناف تحت حد الطلب</span>
                            <span className="text-sm font-bold font-mono text-red-600">
                              {products.filter(p => p.quantity <= p.min_stock).length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs opacity-70">إجمالي الكميات</span>
                            <span className="text-sm font-bold font-mono">
                              {products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {reportsSubTab === 'sales' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ReportCard title="تقرير مبيعات العملاء" description="تحليل مبيعات كل عميل خلال فترة محددة." icon={Users} onClick={() => setActiveReport('تقرير مبيعات العملاء')} />
                    <ReportCard title="تقرير مبيعات المناديب" description="تتبع أداء مناديب المبيعات والعمولات." icon={UserCheck} onClick={() => setActiveReport('تقرير مبيعات المناديب')} />
                    <ReportCard title="تقرير مبيعات الأصناف" description="الأصناف الأكثر مبيعاً والأكثر ربحية." icon={Package} onClick={() => setActiveReport('تقرير مبيعات الأصناف')} />
                    <ReportCard title="تقرير مرتجعات المبيعات" description="تحليل المرتجعات وأسبابها." icon={RotateCcw} onClick={() => setActiveReport('تقرير مرتجعات المبيعات')} />
                    <ReportCard title="تقرير مبيعات الفروع/المستودعات" description="مقارنة أداء المبيعات بين المواقع." icon={Warehouse} onClick={() => setActiveReport('تقرير مبيعات الفروع/المستودعات')} />
                    <ReportCard title="تقرير أعمار ديون العملاء" description="تحليل المبالغ المستحقة وفترات التأخير." icon={Clock} onClick={() => setActiveReport('تقرير أعمار ديون العملاء')} />
                  </div>
                )}

                {reportsSubTab === 'inventory' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ReportCard title="تقرير حركة صنف" description="سجل كامل لحركات الوارد والمنصرف لصنف محدد." icon={Activity} onClick={() => setActiveReport('تقرير حركة صنف')} />
                    <ReportCard title="تقرير أرصدة المستودعات" description="جرد حالي لجميع الأصناف في كل مستودع." icon={Warehouse} onClick={() => setActiveReport('تقرير أرصدة المستودعات')} />
                    <ReportCard title="تقرير الأصناف الراكدة" description="الأصناف التي لم تتحرك لفترة طويلة." icon={PackageX} onClick={() => setActiveReport('تقرير الأصناف الراكدة')} />
                    <ReportCard title="تقرير الأصناف تحت حد الطلب" description="تنبيهات الأصناف التي قاربت على النفاذ." icon={AlertTriangle} onClick={() => setActiveReport('تقرير الأصناف تحت حد الطلب')} />
                    <ReportCard title="تقرير تكلفة المخزون" description="تقييم المخزون بأسعار التكلفة المختلفة." icon={DollarSign} onClick={() => setActiveReport('تقرير تكلفة المخزون')} />
                    <ReportCard title="تقرير التحويلات بين المخازن" description="سجل حركات النقل الداخلي للأصناف." icon={ArrowRightLeft} onClick={() => setActiveReport('تقرير التحويلات بين المخازن')} />
                  </div>
                )}

                {reportsSubTab === 'finance' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ReportCard title="كشف حساب تفصيلي" description="حركة الحساب خلال فترة محددة." icon={FileText} onClick={() => setActiveReport('كشف حساب تفصيلي')} />
                    <ReportCard title="تقرير الأرباح والخسائر" description="ملخص الإيرادات والمصروفات وصافي الربح." icon={TrendingUp} onClick={() => setActiveReport('تقرير الأرباح والخسائر')} />
                    <ReportCard title="الميزانية العمومية" description="بيان الأصول والالتزامات وحقوق الملكية." icon={Scale} onClick={() => setActiveReport('الميزانية العمومية')} />
                    <ReportCard title="تقرير التدفقات النقدية" description="تحليل حركة النقدية الداخلة والخارجة." icon={Coins} onClick={() => setActiveReport('تقرير التدفقات النقدية')} />
                    <ReportCard title="تقرير المصاريف حسب الفئة" description="تحليل المصروفات وتوزيعها على الفئات." icon={PieChartIcon} onClick={() => setActiveReport('تقرير المصاريف حسب الفئة')} />
                    <ReportCard title="تقرير الشيكات المستحقة" description="متابعة الشيكات الصادرة والواردة وتواريخ استحقاقها." icon={CreditCard} onClick={() => setActiveReport('تقرير الشيكات المستحقة')} />
                  </div>
                )}

                {reportsSubTab === 'tax' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ReportCard title="تقرير ضريبة القيمة المضافة" description="ملخص الضريبة على المبيعات والمشتريات." icon={Percent} onClick={() => setActiveReport('تقرير ضريبة القيمة المضافة')} />
                    <ReportCard title="تقرير الإقرار الضريبي" description="بيانات جاهزة لتقديم الإقرار الضريبي." icon={FileCheck} onClick={() => setActiveReport('تقرير الإقرار الضريبي')} />
                    <ReportCard title="تقرير ضريبة الخصم والإضافة" description="تحليل ضرائب الخصم من المنبع." icon={MinusCircle} onClick={() => setActiveReport('تقرير ضريبة الخصم والإضافة')} />
                  </div>
                )}
              </motion.div>
            )}


            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">المالية والحسابات</h2>
                    <p className="text-sm opacity-50">إدارة الحسابات البنكية، شجرة الحسابات، والمستندات المالية.</p>
                  </div>
                  <div className="flex gap-2">
                    {financeSubTab === 'cash' && (
                      <button 
                        onClick={() => {
                          setExpenseForm({
                            type: 'income',
                            amount: 0,
                            category_id: '',
                            account_id: '',
                            description: '',
                            date: new Date().toISOString().split('T')[0]
                          });
                          setShowExpenseModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> حركة مالية جديدة
                      </button>
                    )}
                    {financeSubTab === 'receipts' && (
                      <button 
                        onClick={() => {
                          setFinancialDocForm({ ...financialDocForm, type: 'receipt', number: `RCP-${Date.now()}` });
                          setShowFinancialDocModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> سند قبض
                      </button>
                    )}
                    {financeSubTab === 'payments' && (
                      <button 
                        onClick={() => {
                          setFinancialDocForm({ ...financialDocForm, type: 'payment', number: `PAY-${Date.now()}` });
                          setShowFinancialDocModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> سند صرف
                      </button>
                    )}
                    {financeSubTab === 'settlements' && (
                      <button 
                        onClick={() => {
                          setFinancialDocForm({ ...financialDocForm, type: 'settlement', number: `SET-${Date.now()}` });
                          setShowFinancialDocModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> سند تسوية
                      </button>
                    )}
                    {financeSubTab === 'checks' && (
                      <button 
                        onClick={() => {
                          setFinancialDocForm({ ...financialDocForm, type: 'check', number: `CHK-${Date.now()}` });
                          setShowFinancialDocModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> شيك جديد
                      </button>
                    )}
                    {financeSubTab === 'coa' && (
                      <button 
                        onClick={() => {
                          setCOAForm({ name: '', code: '', type: 'asset', parent_id: '' });
                          setShowCOAModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> إضافة حساب
                      </button>
                    )}
                    {financeSubTab === 'expenses' && (
                      <button 
                        onClick={() => {
                          setExpenseForm({ amount: 0, category_id: '', account_id: '', description: '', date: new Date().toISOString().split('T')[0] });
                          setShowExpenseModal(true);
                        }}
                        className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2"
                      >
                        <Plus size={18} /> صرف نقدية
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-navigation */}
                <div className="flex border-b border-[#141414]/10 gap-8 overflow-x-auto pb-2">
                  <SubTabButton label="الحركة المالية" active={financeSubTab === 'cash'} onClick={() => setFinanceSubTab('cash')} />
                  <SubTabButton label="الصناديق والبنوك" active={financeSubTab === 'accounts'} onClick={() => setFinanceSubTab('accounts')} />
                  <SubTabButton label="سندات القبض" active={financeSubTab === 'receipts'} onClick={() => setFinanceSubTab('receipts')} />
                  <SubTabButton label="سندات الصرف" active={financeSubTab === 'payments'} onClick={() => setFinanceSubTab('payments')} />
                  <SubTabButton label="سندات التسوية" active={financeSubTab === 'settlements'} onClick={() => setFinanceSubTab('settlements')} />
                  <SubTabButton label="الشيكات" active={financeSubTab === 'checks'} onClick={() => setFinanceSubTab('checks')} />
                  <SubTabButton label="شجرة الحسابات" active={financeSubTab === 'coa'} onClick={() => setFinanceSubTab('coa')} />
                  <SubTabButton label="المصاريف" active={financeSubTab === 'expenses'} onClick={() => setFinanceSubTab('expenses')} />
                  <SubTabButton label="قيود اليومية" active={financeSubTab === 'journal'} onClick={() => setFinanceSubTab('journal')} />
                </div>

                {financeSubTab === 'cash' && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">النوع</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">الحساب</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">المبلغ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {finance.map((f: any) => (
                          <tr key={f.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs opacity-50">{f.date}</td>
                            <td className="p-4 text-xs">
                              <span className={cn(
                                "px-2 py-0.5 rounded-sm font-bold",
                                f.type === 'income' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              )}>
                                {f.type === 'income' ? 'إيراد' : 'مصروف'}
                              </span>
                            </td>
                            <td className="p-4 text-sm font-bold">{bankAccounts.find(ba => ba.id === f.account_id)?.name || 'نقدي'}</td>
                            <td className={cn("p-4 text-sm font-mono font-bold", f.type === 'income' ? "text-green-600" : "text-red-600")}>
                              {f.type === 'income' ? '+' : '-'}{f.amount.toLocaleString()} ج.م
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleViewJournalEntry(f.id)} className="p-1 hover:bg-[#141414]/5 text-purple-600 rounded transition-colors" title="قيد اليومية">
                                  <ClipboardList size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setExpenseForm({
                                      id: f.id,
                                      type: f.type,
                                      amount: f.amount,
                                      category_id: f.category_id || '',
                                      account_id: f.account_id || '',
                                      description: f.description || '',
                                      date: f.date
                                    });
                                    setShowExpenseModal(true);
                                  }}
                                  className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteFinance(f.id)} className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {financeSubTab === 'accounts' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bankAccounts.map(ba => (
                      <div key={ba.id} className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-[#141414]/5 rounded-full">
                            <ShieldCheck size={24} className="text-[#141414]" />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold uppercase opacity-50">{ba.type === 'bank' ? 'بنك' : 'صندوق'}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setBankAccountForm(ba);
                                  setShowBankAccountModal(true);
                                }}
                                className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteBankAccount(ba.id)}
                                className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-sans font-bold text-lg">{ba.name}</h3>
                          <p className="text-xs opacity-50 mb-4">{ba.account_number || '---'}</p>
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] font-bold uppercase opacity-50">الرصيد الحالي</p>
                            <p className="text-xl font-mono font-bold">{ba.balance.toLocaleString()} ج.م</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        console.log('Opening Bank Account Modal...');
                        setBankAccountForm({
                          name: '',
                          type: 'cash',
                          currency_id: currencies[0]?.id || '',
                          account_number: '',
                          bank_name: '',
                          branch_name: '',
                          initial_balance: 0,
                          is_active: true
                        });
                        setShowBankAccountModal(true);
                      }}
                      className="border-2 border-dashed border-[#141414]/10 p-6 flex flex-col items-center justify-center gap-4 hover:bg-[#141414]/5 transition-all group min-h-[200px]"
                    >
                      <div className="p-4 bg-[#141414]/5 rounded-full group-hover:bg-[#141414]/10 transition-colors">
                        <Plus size={32} className="text-[#141414]/40" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-sans font-bold text-lg text-[#141414]/60">إضافة حساب جديد</h3>
                        <p className="text-xs opacity-40 uppercase font-bold tracking-widest mt-1">صندوق أو حساب بنكي</p>
                      </div>
                    </button>
                  </div>
                )}

                {(financeSubTab === 'receipts' || financeSubTab === 'payments' || financeSubTab === 'settlements' || financeSubTab === 'checks') && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">رقم السند</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">التاريخ</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">الطرف</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">الحساب</th>
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50">المبلغ</th>
                          {financeSubTab === 'checks' && <th className="p-4 text-[10px] font-bold uppercase opacity-50">الاستحقاق</th>}
                          {financeSubTab === 'checks' && <th className="p-4 text-[10px] font-bold uppercase opacity-50">الحالة</th>}
                          <th className="p-4 text-[10px] font-bold uppercase opacity-50 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {financialDocs.filter(d => d.type === (
                          financeSubTab === 'receipts' ? 'receipt' : 
                          financeSubTab === 'payments' ? 'payment' : 
                          financeSubTab === 'settlements' ? 'settlement' : 'check'
                        )).map((doc) => (
                          <tr key={doc.id} className="hover:bg-[#141414]/5 transition-colors">
                            <td className="p-4 text-xs font-mono font-bold">{doc.number}</td>
                            <td className="p-4 text-xs opacity-50">{doc.date}</td>
                            <td className="p-4 text-sm font-bold">{suppliersCustomers.find(sc => sc.id === doc.party_id)?.name || '---'}</td>
                            <td className="p-4 text-xs opacity-50">{bankAccounts.find(ba => ba.id === doc.account_id)?.name || '---'}</td>
                            <td className="p-4 text-sm font-mono font-bold">{doc.amount.toLocaleString()} {currencies.find(c => c.id === doc.currency_id)?.symbol || 'ج.م'}</td>
                            {financeSubTab === 'checks' && <td className="p-4 text-xs opacity-50">{doc.due_date}</td>}
                            {financeSubTab === 'checks' && (
                              <td className="p-4 text-xs">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-sm font-bold",
                                  doc.status === 'cleared' ? "bg-green-100 text-green-700" : 
                                  doc.status === 'bounced' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                  {doc.status === 'cleared' ? 'تم التحصيل' : 
                                   doc.status === 'bounced' ? 'مرفوض' : 'قيد الانتظار'}
                                </span>
                              </td>
                            )}
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleViewJournalEntry(doc.number || doc.id)} className="p-1 hover:bg-[#141414]/5 text-purple-600 rounded transition-colors" title="قيد اليومية">
                                  <ClipboardList size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setFinancialDocForm(doc);
                                    setShowFinancialDocModal(true);
                                  }}
                                  className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteFinancialDoc(doc.id)}
                                  className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {financeSubTab === 'coa' && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 overflow-hidden rounded-sm">
                    <div className="bg-[#141414]/5 p-4 border-b border-[#141414]/10 flex justify-between items-center">
                      <h3 className="font-sans font-bold text-sm uppercase opacity-50">هيكل شجرة الحسابات</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setCOAForm({ name: '', code: '', type: 'asset', parent_id: '' });
                            setShowCOAModal(true);
                          }}
                          className="p-2 hover:bg-[#141414]/5 rounded-sm text-xs font-bold flex items-center gap-2"
                        >
                          <Plus size={14} /> إضافة حساب رئيسي
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                      {chartOfAccounts.filter(a => !a.parent_id).map((account) => (
                        <COATreeNode 
                          key={account.id} 
                          account={account} 
                          allAccounts={chartOfAccounts} 
                          onEdit={(acc) => {
                            setCOAForm(acc);
                            setShowCOAModal(true);
                          }}
                          onDelete={handleDeleteCOA}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {financeSubTab === 'expenses' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[var(--app-card-bg)] border border-[#141414]/10">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right">
                          <thead>
                            <tr className="border-b border-[#141414]/10 text-[10px] font-sans font-bold uppercase opacity-50">
                              <th className="p-4">التاريخ</th>
                              <th className="p-4">التصنيف</th>
                              <th className="p-4">الحساب</th>
                              <th className="p-4">الوصف</th>
                              <th className="p-4">المبلغ</th>
                              <th className="p-4 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#141414]/5">
                            {finance.filter(f => f.type === 'expense').map((f: any) => (
                              <tr key={f.id} className="hover:bg-[#141414]/5 transition-colors">
                                <td className="p-4 text-xs opacity-50">{f.date}</td>
                                <td className="p-4 text-sm font-bold">{f.category_name || 'عام'}</td>
                                <td className="p-4 text-xs opacity-50">{f.account_name || 'نقدي'}</td>
                                <td className="p-4 text-xs">{f.description}</td>
                                <td className="p-4 font-mono text-sm font-bold text-red-600">-{f.amount.toLocaleString()} ج.م</td>
                                <td className="p-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button onClick={() => handleViewJournalEntry(f.id)} className="p-1 hover:bg-[#141414]/5 text-purple-600 rounded transition-colors" title="قيد اليومية">
                                      <ClipboardList size={14} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setExpenseForm(f);
                                        setShowExpenseModal(true);
                                      }}
                                      className="p-1 hover:bg-[#141414]/5 text-blue-600 rounded transition-colors"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteFinance(f.id)}
                                      className="p-1 hover:bg-[#141414]/5 text-red-600 rounded transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6">
                        <h3 className="font-sans font-bold text-lg mb-4">تصنيفات المصاريف</h3>
                        <div className="space-y-2">
                          {expenseCategories.map(c => (
                            <div key={c.id} className="p-3 bg-[#141414]/5 flex justify-between items-center">
                              <span className="text-sm font-bold">{c.name}</span>
                              <span className="text-[10px] opacity-50">
                                {finance.filter(f => f.category_id === c.id).length} حركة
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {financeSubTab === 'journal' && (
                  <div className="space-y-6">
                    <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-sans font-bold">قيود اليومية</h3>
                        <div className="flex gap-4 items-center">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                            <input 
                              type="text" 
                              placeholder="بحث برقم السند أو الوصف..." 
                              className="p-2 pr-10 border border-[#141414]/10 text-sm focus:outline-none focus:border-[#141414]/30 w-64"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={() => {
                              setJournalForm({
                                date: new Date().toISOString().split('T')[0],
                                description: '',
                                lines: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }]
                              });
                              setShowJournalModal(true);
                            }}
                            className="px-6 py-2 bg-[#141414] text-[#E4E3E0] text-sm font-bold flex items-center gap-2 hover:bg-[#141414]/90 transition-colors"
                          >
                            <Plus size={18} /> قيد يدوي جديد
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {journalEntries
                          .filter(je => 
                            (je.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (je.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (je.reference_id || '').toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((je: any) => {
                            const lines = journalEntryLines.filter(l => l.journal_entry_id === je.id);
                            const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
                            const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
                            
                            return (
                              <div key={je.id} className="border border-[#141414]/10 rounded-sm overflow-hidden">
                                <div className="bg-[#141414]/5 p-4 flex justify-between items-center border-b border-[#141414]/10">
                                  <div className="flex gap-6 items-center">
                                    <span className="text-xs font-mono font-bold bg-[#141414] text-white px-2 py-1 rounded-sm">{je.id}</span>
                                    <span className="text-sm font-bold">{je.description}</span>
                                    <span className="text-xs opacity-50">{new Date(je.date).toLocaleDateString('ar-EG')}</span>
                                  </div>
                                  <div className="text-xs font-bold">
                                    الإجمالي: <span className="font-mono">{totalDebit.toLocaleString()} ج.م</span>
                                  </div>
                                </div>
                                <table className="w-full text-right text-xs">
                                  <thead>
                                    <tr className="bg-[#141414]/2 border-b border-[#141414]/5 font-bold opacity-50">
                                      <th className="p-3">الحساب</th>
                                      <th className="p-3 text-left">مدين</th>
                                      <th className="p-3 text-left">دائن</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#141414]/5">
                                    {lines.map((l: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-[#141414]/2 transition-colors">
                                        <td className="p-3">
                                          <div className="font-bold">{chartOfAccounts.find(acc => acc.id === l.account_id)?.name || l.account_id}</div>
                                          <div className="text-[10px] opacity-50">{chartOfAccounts.find(acc => acc.id === l.account_id)?.code}</div>
                                        </td>
                                        <td className="p-3 text-left font-mono">{Number(l.debit) > 0 ? Number(l.debit).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
                                        <td className="p-3 text-left font-mono">{Number(l.credit) > 0 ? Number(l.credit).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-[#141414]/5 font-bold">
                                      <td className="p-3">الإجمالي</td>
                                      <td className="p-3 text-left font-mono">{totalDebit.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                      <td className="p-3 text-left font-mono">{totalCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}



            {activeTab === 'definitions' && (
              <motion.div
                key="definitions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">التعريفات الأساسية</h2>
                    <p className="text-sm opacity-50">إدارة وحدات القياس، فئات المنتجات، ومجموعات العملاء والموردين.</p>
                  </div>
                  <div className="flex gap-2">
                    <SubTabButton label="التعريفات العامة" active={definitionsSubTab === 'general'} onClick={() => setDefinitionsSubTab('general')} />
                    <SubTabButton label="الحسابات" active={definitionsSubTab === 'accounts'} onClick={() => setDefinitionsSubTab('accounts')} />
                  </div>
                </div>

                {definitionsSubTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Units Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">وحدات القياس</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'product_units', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {productUnits.map(u => (
                        <div key={u.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{u.name}</span>
                          <button onClick={() => handleDefinitionDelete('product_units', u.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">فئات المنتجات</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'product_categories', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {productCategories.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{c.name}</span>
                          <button onClick={() => handleDefinitionDelete('product_categories', c.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Groups Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">مجموعات العملاء</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'customer_groups', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {customerGroups.map(g => (
                        <div key={g.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{g.name}</span>
                          <button onClick={() => handleDefinitionDelete('customer_groups', g.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supplier Groups Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">مجموعات الموردين</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'supplier_groups', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {supplierGroups.map(g => (
                        <div key={g.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{g.name}</span>
                          <button onClick={() => handleDefinitionDelete('supplier_groups', g.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Methods Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">طرق الدفع</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'payment_methods', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {paymentMethods.map(m => (
                        <div key={m.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{m.name}</span>
                          <button onClick={() => handleDefinitionDelete('payment_methods', m.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tax Types Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">أنواع الضرائب</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'tax_types', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {taxTypes.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{t.name} ({t.rate}%)</span>
                          <button onClick={() => handleDefinitionDelete('tax_types', t.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Currencies Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">العملات</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'currencies', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {currencies.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{c.name} ({c.code})</span>
                          <button onClick={() => handleDefinitionDelete('currencies', c.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Departments Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">الأقسام</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'departments', name: '', description: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {departments.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{d.name}</span>
                          <button onClick={() => handleDefinitionDelete('departments', d.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sales Representatives Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">مناديب المبيعات</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'sales_reps', name: '', phone: '', commission_percent: 0 }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {salesReps.map(r => (
                        <div key={r.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{r.name}</span>
                            <span className="text-[10px] opacity-50">{r.phone}</span>
                          </div>
                          <button onClick={() => handleDefinitionDelete('sales_reps', r.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Companies Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">شركات الشحن</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'shipping_cos', name: '', phone: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {shippingCos.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{s.name}</span>
                          <button onClick={() => handleDefinitionDelete('shipping_cos', s.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Centers Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">مراكز التكلفة</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'cost_centers', name: '', code: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {costCenters.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{c.name} ({c.code})</span>
                          <button onClick={() => handleDefinitionDelete('cost_centers', c.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">المشاريع</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'projects', name: '', code: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {projects.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{p.name} ({p.code})</span>
                          <button onClick={() => handleDefinitionDelete('projects', p.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Branches Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">الفروع</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'branches', name: '', code: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {branches.map(b => (
                        <div key={b.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{b.name} ({b.code})</span>
                          <button onClick={() => handleDefinitionDelete('branches', b.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brands Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">الماركات</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'brands', name: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {brands.map(b => (
                        <div key={b.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <span className="text-sm font-bold">{b.name}</span>
                          <button onClick={() => handleDefinitionDelete('brands', b.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Models Section */}
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-sans font-bold text-lg">الموديلات</h3>
                      <button 
                        onClick={() => { setDefinitionForm({ type: 'models', name: '', brand_id: '' }); setShowDefinitionModal(true); }}
                        className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                      ><Plus size={16} /></button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {models.map(m => (
                        <div key={m.id} className="flex justify-between items-center p-3 bg-[#141414]/5 rounded-sm group">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{m.name}</span>
                            <span className="text-[10px] opacity-50">{brands.find(b => b.id === m.brand_id)?.name}</span>
                          </div>
                          <button onClick={() => handleDefinitionDelete('models', m.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {definitionsSubTab === 'accounts' && (
                <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8 space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-sans font-bold text-xl">ربط الحسابات الأساسية</h3>
                      <p className="text-sm opacity-50">تحديد الحسابات التي سيتم الترحيل إليها تلقائياً عند تنفيذ العمليات.</p>
                    </div>
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="px-6 py-3 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90 flex items-center gap-2 font-bold disabled:opacity-50"
                    >
                      {isSavingSettings ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      حفظ الإعدادات
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'sales_account_id', label: 'حساب المبيعات', type: 'revenue', defaultCode: '400001' },
                      { key: 'sales_returns_account_id', label: 'حساب مردودات المبيعات', type: 'revenue', defaultCode: '400002' },
                      { key: 'purchases_account_id', label: 'حساب المشتريات', type: 'expense', defaultCode: '500001' },
                      { key: 'purchase_returns_account_id', label: 'حساب مردودات المشتريات', type: 'expense', defaultCode: '500002' },
                      { key: 'input_vat_account_id', label: 'حساب ضريبة القيمة المضافة المدخلة', type: 'liability', defaultCode: '200001' },
                      { key: 'output_vat_account_id', label: 'حساب ضريبة القيمة المضافة المخرجة', type: 'liability', defaultCode: '200002' },
                      { key: 'discount_allowed_account_id', label: 'حساب الخصم المسموح به', type: 'expense', defaultCode: '500003' },
                      { key: 'discount_earned_account_id', label: 'حساب الخصم المكتسب', type: 'revenue', defaultCode: '400003' },
                      { key: 'other_payables_account_id', label: 'حساب دائنة أخرى', type: 'liability', defaultCode: '200002' },
                      { key: 'other_receivables_account_id', label: 'حساب مدينة أخرى', type: 'asset', defaultCode: '100001' },
                      { key: 'expenses_account_id', label: 'حساب المصروفات', type: 'expense', defaultCode: '500004' },
                      { key: 'default_cash_account_id', label: 'حساب الصندوق الافتراضي', type: 'asset', defaultCode: '110001' },
                      { key: 'default_bank_account_id', label: 'حساب البنك الافتراضي', type: 'asset', defaultCode: '120001' },
                    ].map((mapping) => (
                      <div key={mapping.key} className="space-y-2 p-4 bg-[#141414]/5 rounded-sm border border-[#141414]/5">
                        <label className="text-xs font-sans font-bold uppercase opacity-50">{mapping.label}</label>
                        <div className="flex gap-2">
                          <select 
                            className="flex-1 p-3 bg-white border border-[#141414]/10 focus:border-[#141414] outline-none text-sm"
                            value={(systemSettings as any)[mapping.key] || ''}
                            onChange={(e) => setSystemSettings({ ...systemSettings, [mapping.key]: e.target.value })}
                          >
                            <option value="">اختر حساباً...</option>
                            {chartOfAccounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              setCOAForm({ name: mapping.label, code: mapping.defaultCode, type: mapping.type as any, parent_id: '' });
                              setShowCOAModal(true);
                            }}
                            title="إضافة حساب جديد"
                            className="p-3 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 pb-20"
              >
                <div>
                  <h2 className="text-3xl font-sans font-bold tracking-tight">الإعدادات</h2>
                  <p className="text-sm opacity-50">تكوين النظام والاتصال بقاعدة البيانات وتخصيص المظهر.</p>
                </div>

                <div className={cn("grid gap-8", currentUser?.role === 'setup_admin' ? "grid-cols-1 max-w-2xl mx-auto w-full" : "grid-cols-1 lg:grid-cols-2")}>
                  {currentUser?.role !== 'setup_admin' && (
                    <>
                      <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8 space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-sans font-bold text-lg text-blue-600">إعدادات الضريبة</h3>
                            <p className="text-sm opacity-70">تحديد نسبة الضريبة الافتراضية التي ستطبق على الفواتير.</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold uppercase opacity-50">نسبة الضريبة الافتراضية (%)</label>
                            <input 
                              type="number"
                              className="w-full p-3 bg-blue-50 border border-blue-200 focus:border-blue-500 outline-none text-sm font-mono font-bold"
                              value={systemSettings.default_tax_percent || 14}
                              onChange={(e) => setSystemSettings({ ...systemSettings, default_tax_percent: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-sans font-bold text-lg">تخصيص المظهر</h3>
                          <p className="text-sm opacity-70">تغيير اسم البرنامج والخطوط والألوان.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold uppercase opacity-50">اسم البرنامج</label>
                            <input 
                              type="text"
                              className="w-full p-3 bg-[#141414]/5 border border-[#141414]/10 focus:border-[#141414] outline-none text-sm"
                              value={systemSettings.app_name}
                              onChange={(e) => setSystemSettings({ ...systemSettings, app_name: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold uppercase opacity-50">نوع الخط</label>
                            <select 
                              className="w-full p-3 bg-[#141414]/5 border border-[#141414]/10 focus:border-[#141414] outline-none text-sm"
                              value={systemSettings.font_family}
                              onChange={(e) => setSystemSettings({ ...systemSettings, font_family: e.target.value })}
                            >
                              <option value="Cairo">Cairo (عربي)</option>
                              <option value="Inter">Inter (عصري)</option>
                              <option value="Roboto">Roboto (كلاسيكي)</option>
                              <option value="system-ui">خط النظام</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold uppercase opacity-50">لون الخلفية</label>
                              <input 
                                type="color"
                                className="w-full h-10 p-1 bg-[#141414]/5 border border-[#141414]/10 outline-none cursor-pointer"
                                value={systemSettings.bg_color}
                                onChange={(e) => setSystemSettings({ ...systemSettings, bg_color: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold uppercase opacity-50">لون الخط الأساسي</label>
                              <input 
                                type="color"
                                className="w-full h-10 p-1 bg-[#141414]/5 border border-[#141414]/10 outline-none cursor-pointer"
                                value={systemSettings.text_color}
                                onChange={(e) => setSystemSettings({ ...systemSettings, text_color: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold uppercase opacity-50">لون العناوين</label>
                              <input 
                                type="color"
                                className="w-full h-10 p-1 bg-[#141414]/5 border border-[#141414]/10 outline-none cursor-pointer"
                                value={systemSettings.heading_color}
                                onChange={(e) => setSystemSettings({ ...systemSettings, heading_color: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold uppercase opacity-50">لون التفاصيل</label>
                              <input 
                                type="color"
                                className="w-full h-10 p-1 bg-[#141414]/5 border border-[#141414]/10 outline-none cursor-pointer"
                                value={systemSettings.detail_color}
                                onChange={(e) => setSystemSettings({ ...systemSettings, detail_color: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold uppercase opacity-50">لون الكروت</label>
                              <input 
                                type="color"
                                className="w-full h-10 p-1 bg-[#141414]/5 border border-[#141414]/10 outline-none cursor-pointer"
                                value={systemSettings.card_bg}
                                onChange={(e) => setSystemSettings({ ...systemSettings, card_bg: e.target.value })}
                              />
                            </div>
                          </div>

                          <button 
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="w-full py-3 bg-[#141414] text-[#E4E3E0] font-bold hover:bg-[#141414]/90 transition-colors flex items-center justify-center gap-2"
                          >
                            {isSavingSettings ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                          </button>
                        </div>
                      </div>

                      <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8 space-y-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <h3 className="font-sans font-bold text-lg">إدارة المستخدمين</h3>
                            <p className="text-sm opacity-70">إضافة وتعديل مستخدمي النظام وصلاحياتهم.</p>
                          </div>
                          <button 
                            onClick={() => { setUserForm({ username: '', password: '', full_name: '', role: 'user', is_active: true }); setEditingUser(null); setShowUserModal(true); }}
                            className="p-2 bg-[#141414] text-white rounded-sm hover:bg-[#141414]/90"
                          ><Plus size={16} /></button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                          {users.map(u => (
                            <div key={u.id} className="flex justify-between items-center p-4 bg-[#141414]/5 rounded-sm group hover:bg-[#141414]/10 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#141414] text-white flex items-center justify-center rounded-full font-bold">
                                  {u.username[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{u.full_name}</span>
                                  <span className="text-[10px] opacity-50">@{u.username} | {u.role === 'admin' ? 'مدير' : 'مستخدم'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full", u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                  {u.is_active ? 'نشط' : 'معطل'}
                                </span>
                                <button 
                                  onClick={() => { 
                                    setEditingUser(u); 
                                    setUserForm({ username: u.username, password: '', full_name: u.full_name, role: u.role, is_active: u.is_active }); 
                                    setShowUserModal(true); 
                                  }}
                                  className="p-2 hover:bg-[#141414]/5 rounded-full text-blue-600 transition-colors"
                                ><Edit3 size={14} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8 space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-sans font-bold text-lg flex items-center gap-2">
                        <Database className="text-blue-600" size={20} />
                        <span>اتصال قاعدة البيانات</span>
                      </h3>
                      <p className="text-sm opacity-70">تغيير رابط الاتصال بقاعدة البيانات الخارجية وتأسيس الجداول.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-sans font-bold uppercase opacity-50 flex justify-between items-center">
                          <span>رابط الاتصال (DATABASE_URL)</span>
                          <span className="text-blue-600 font-normal">تأكد من تركيبة الرابط لتفادي الأخطاء</span>
                        </label>
                        <div className="relative flex items-center">
                          <input 
                            type={showConnectionString ? "text" : "password"}
                            placeholder="postgres://user:password@hostname:port/dbname"
                            className="w-full p-3 pl-11 bg-[#141414]/5 border border-[#141414]/10 focus:border-[#141414] outline-none text-sm font-mono text-left"
                            dir="ltr"
                            value={dbConnectionString}
                            onChange={(e) => setDbConnectionString(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConnectionString(!showConnectionString)}
                            className="absolute left-3 text-gray-500 hover:text-black transition-colors p-1"
                            title={showConnectionString ? "إخفاء الرابط" : "عرض الرابط"}
                          >
                            {showConnectionString ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Detailed Connection Link Guide Checklist */}
                      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-3.5 text-right" dir="rtl">
                        <div className="flex items-center gap-2 text-blue-700 text-xs font-bold font-sans">
                          <Info size={14} className="shrink-0" />
                          <span>توضيح لتركيبة الرابط الصحيحة (PostgreSQL):</span>
                        </div>
                        
                        <div className="bg-[#141414]/5 border border-[#141414]/10 rounded px-2.5 py-2 text-[11px] font-mono text-left select-all" dir="ltr">
                          postgres://<span className="text-red-600 font-bold">user</span>:<span className="text-green-600 font-bold">password</span>@<span className="text-blue-600 font-bold">host</span>:<span className="text-purple-600 font-bold">port</span>/<span className="text-orange-600 font-bold">dbname</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600 leading-relaxed border-t border-blue-500/10 pt-2.5">
                          <div className="space-y-1">
                            <p>• <strong className="text-red-600">user:</strong> اسم مستخدم قاعدة البيانات (مثل <code className="bg-white px-1 border border-black/5 rounded">postgres</code>)</p>
                            <p>• <strong className="text-green-600 font-sans">password:</strong> كلمة مرور حساب قاعدة البيانات الخاص بك</p>
                            <p>• <strong className="text-blue-600">host:</strong> عنوان السيرفر (مثل <code className="bg-white px-1 border border-black/5 rounded">localhost</code> محلياً)</p>
                          </div>
                          <div className="space-y-1">
                            <p>• <strong className="text-purple-600">port:</strong> منفذ خادم Postgres (الافتراضي هو <code className="bg-white px-1 border border-black/5 rounded">5432</code>)</p>
                            <p>• <strong className="text-orange-600">dbname:</strong> اسم قاعدة البيانات التي قمت بإنشائها</p>
                            <p>• ⚠️ <strong className="text-red-700 font-sans">هام:</strong> تأكد من عدم وجود مسافات فارغة في بداية أو نهاية الرابط عند اللصق.</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleSaveDbConnection}
                        disabled={isSavingDb}
                        className={cn(
                          "w-full py-3 bg-[#141414] text-[#E4E3E0] font-bold hover:bg-[#141414]/90 transition-colors flex items-center justify-center gap-2",
                          isSavingDb && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isSavingDb && <Loader2 className="animate-spin" size={16} />}
                        <span>{isSavingDb ? 'جاري اختبار الاتصال وحفظ الإعدادات...' : 'حفظ واختبار الاتصال بالنظام'}</span>
                      </button>
                      
                      {saveStatus === 'success' && (
                        <div className="p-3 bg-green-100 border border-green-200 text-green-800 text-xs font-bold rounded-lg flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                          <span>تم الاتصال بنجاح وتوثيق الربط بين السيرفر وقاعدة البيانات بنجاح!</span>
                        </div>
                      )}
                      {saveStatus === 'error' && (
                        <div className="p-3 bg-red-100 border border-red-200 text-red-800 text-xs font-bold rounded-lg flex items-start gap-2">
                          <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p>فشل الاتصال بقاعدة البيانات.</p>
                            <p className="font-normal text-[11px] opacity-90">يرجى التحقق من صحة الرابط والتأكد من تفعيل السيرفر وصلاحية البيانات المدخلة.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {currentUser.role === 'admin' && (
                  <div className="bg-[var(--app-card-bg)] border border-[#141414]/10 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="font-sans font-bold text-lg">إدارة المستخدمين</h3>
                        <p className="text-sm opacity-60">إضافة مستخدمين جدد وتحديد صلاحياتهم (مدير / مستخدم).</p>
                      </div>
                      <button 
                        onClick={() => { setEditingUser(null); setUserForm({ username: '', password: '', full_name: '', role: 'user', is_active: true }); setShowUserModal(true); }}
                        className="px-4 py-2 bg-[#141414] text-white text-xs font-bold flex items-center gap-2"
                      >
                        <Plus size={14} /> مستخدم جديد
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b border-[#141414]/10 text-[10px] font-sans font-bold uppercase opacity-50">
                            <th className="p-4 text-right">الاسم الكامل</th>
                            <th className="p-4 text-right">اسم المستخدم</th>
                            <th className="p-4 text-right">الصلاحية</th>
                            <th className="p-4 text-right">الحالة</th>
                            <th className="p-4 text-right">تاريخ الإنشاء</th>
                            <th className="p-4 text-right">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]/5">
                          {users.map(u => (
                            <tr key={u.id} className="text-sm group">
                              <td className="p-4 font-bold">{u.full_name}</td>
                              <td className="p-4 opacity-70">{u.username}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] font-bold uppercase",
                                  u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                )}>
                                  {u.role === 'admin' ? 'مدير' : 'مستخدم'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", u.is_active ? "bg-green-500" : "bg-red-500")} />
                                  <span className="text-xs">{u.is_active ? 'نشط' : 'معطل'}</span>
                                </div>
                              </td>
                              <td className="p-4 opacity-50 text-xs">2026-03-24</td>
                              <td className="p-4">
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingUser(u); setUserForm({ ...u, password: '' }); setShowUserModal(true); }} className="p-1 hover:bg-[#141414]/10 rounded"><Edit size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <ConfirmationModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>
      </main>
    </div>
  );
}
