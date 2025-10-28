# Next.js 14 Frontend Architecture Analysis

## Framework Migration: React Router → Next.js App Router

### 🏗️ **Architecture Overview**

The PlantSmart frontend has been completely migrated from a traditional React SPA with React Router to **Next.js 14 with App Router**, providing:

- **Server-Side Rendering (SSR)** capabilities
- **File-based routing** system
- **Built-in optimization** (Image, Font, Bundle optimization)
- **Middleware** for authentication and route protection
- **API Routes** co-location (though using separate backend)

---

## 📁 **New Directory Structure**

### **App Router Structure (`/app`)**
```
src/app/
├── globals.css          # Global styles with Tailwind
├── layout.tsx           # Root layout with providers
├── page.tsx            # Landing page (/)
├── middleware.js        # Route protection & auth
├── admin/
│   ├── page.tsx        # Admin dashboard (/admin)
│   ├── loading.tsx     # Loading UI
│   ├── pricing/        # Admin pricing management
│   └── file-manager/   # Admin file management
├── dashboard/          
│   └── page.tsx        # Dashboard redirect logic
├── user-dashboard/     
│   └── page.tsx        # User dashboard (/user-dashboard)
├── login/
│   └── page.tsx        # Login page (/login)
├── register/
│   └── page.tsx        # Registration (/register)
├── forgotPassword/
│   └── page.tsx        # Password reset (/forgotPassword)
├── payment/
│   └── page.tsx        # Payment page (/payment)
├── logout/
│   └── page.tsx        # Logout page (/logout)
└── context/
    └── user-context.tsx # Global user state
```

### **Component Architecture**
```
src/components/
├── ui/                 # Shadcn/ui components (35+ components)
├── dashboards/         # Specialized dashboard components
├── LanguageSwitcher.tsx # i18n language selector
├── login-form.tsx      # Authentication forms
├── register-form.tsx   
├── forgot-password-form.tsx
└── theme-provider.tsx  # Theme management
```

### **API Layer**
```
src/api/
├── axiosClient.js      # Configured HTTP client
├── authApi.js         # Authentication endpoints
├── userApi.js         # User management
├── paymentApi.js      # Payment processing
├── plantApi.js        # Plant monitoring
├── dashboardApi.js    # Dashboard data
├── reportsApi.js      # Analytics & reports
└── [8 more specialized APIs]
```

---

## 🔄 **Migration Changes**

### **Routing System**

#### **Before (React Router)**
```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

#### **After (Next.js App Router)**
```
/app/login/page.tsx     → /login
/app/register/page.tsx  → /register  
/app/dashboard/page.tsx → /dashboard
```

**Protection via Middleware:**
```javascript
// middleware.js
export function middleware(request) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  if (!publicPaths.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

### **State Management**

#### **Before (React Context)**
```jsx
// Multiple contexts scattered
<AuthProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</AuthProvider>
```

#### **After (Centralized Providers)**
```tsx
// app/layout.tsx
<I18nProvider>
  <UserProvider>
    {children}
  </UserProvider>
</I18nProvider>
```

---

## 🌐 **Internationalization (i18n) Integration**

### **Setup**
- **Library**: `react-i18next` with `i18next-browser-languagedetector`
- **Languages**: EN, VI, ZH, JA, KR, FR
- **Provider**: Custom `I18nProvider` wrapping root layout
- **Detection**: localStorage → browser language

### **Translation Structure**
```json
{
  "common": { "email": "Email", "password": "Password" },
  "auth": { "login": "Login", "register": "Register" },
  "errors": { "loginFailed": "Login failed" },
  "navigation": { "dashboard": "Dashboard" }
}
```

### **Usage Pattern**
```tsx
const { t } = useTranslation()
<h1>{t('auth.loginTitle')}</h1>
<p>{t('errors.genericError')}</p>
```

---

## 🎨 **UI Framework & Styling**

### **Tailwind CSS Configuration**
- **Framework**: Tailwind CSS with custom design tokens
- **Components**: Shadcn/ui (35+ pre-built components)
- **Theme**: CSS variables with dark/light mode support
- **Responsive**: Mobile-first design patterns

### **Component Library**
```
ui/
├── button.tsx          # Button variants
├── card.tsx           # Card layouts  
├── form.tsx           # Form controls
├── input.tsx          # Input fields
├── dropdown-menu.tsx  # Dropdowns
├── dialog.tsx         # Modals
├── toast.tsx          # Notifications
└── [28 more components]
```

---

## 🔐 **Authentication & Security**

### **JWT Token Management**
```javascript
// axiosClient.js
axiosClient.interceptors.request.use((config) => {
  const token = Cookies.get("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
})
```

### **Route Protection**
```javascript
// middleware.js - Edge Runtime
const publicPaths = ['/', '/login', '/register', '/forgot-password']
const premiumPaths = ['/zones', '/reports', '/thresholds']

// Redirect logic based on authentication and role
```

### **User Context**
```typescript
interface User {
  id: string
  email: string
  name: string
  role: "normal" | "premium"
  subscriptionStatus: "active" | "expired" | "none"
  subscriptionEndDate?: string
  createdAt: string
}
```

---

## 🌍 **Backend Integration**

### **API Client Configuration**
```javascript
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
})
```

### **Parameter Mapping**

#### **Authentication**
```javascript
// Frontend → Backend parameter mapping
authApi.register(email, password, confirmPassword, given_name, family_name, phoneNumber, newsletter)
// Maps to backend: { email, password, given_name, family_name, phoneNumber, newsletter }

authApi.login(email, password) 
// Maps to backend: { email, password }

authApi.forgotPassword(email)
// Maps to backend: { email }
```

#### **Error Handling**
```typescript
try {
  await authApi.login(email, password)
} catch (error: any) {
  setError(error?.response?.data?.message || t('errors.loginFailed'))
}
```

---

## ⚡ **Performance Optimizations**

### **Next.js Built-in Features**
- **Automatic Code Splitting**: Page-level and component-level
- **Image Optimization**: Next.js Image component with WebP
- **Font Optimization**: Automatic font loading optimization
- **Bundle Analysis**: Webpack Bundle Analyzer integration

### **Loading States**
```tsx
// app/admin/loading.tsx - Automatic loading UI
export default function Loading() {
  return <div>Loading admin dashboard...</div>
}
```

### **Error Boundaries**
```tsx
// app/error.tsx - Automatic error handling
export default function Error({ error, reset }) {
  return <div>Something went wrong!</div>
}
```

---

## 🧪 **Development & Testing**

### **Environment Configuration**
```javascript
// env-loader.js - Loads from root .env
const rootEnv = dotenv.parse(fs.readFileSync('../.env'))
const clientEnv = Object.fromEntries(
  Object.entries(rootEnv).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
)
```

### **TypeScript Integration**
- **Strict Mode**: Enabled with proper type checking
- **Path Aliases**: `@/*` mapped to `src/*`
- **Component Types**: Proper React.FC and interface definitions
- **API Types**: Type-safe API responses

---

## 🚀 **Deployment Considerations**

### **Build Output**
```bash
npm run build  # Generates optimized production build
npm start      # Starts production server
npm run dev    # Development with hot reload
```

### **Environment Variables**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

---

## 📋 **Migration Benefits**

### **Performance Improvements**
- ✅ **SSR/SSG**: Better SEO and initial load times
- ✅ **Automatic Optimizations**: Images, fonts, bundles
- ✅ **Code Splitting**: Reduced JavaScript payload
- ✅ **Edge Runtime**: Faster middleware execution

### **Developer Experience**
- ✅ **File-based Routing**: Intuitive route structure
- ✅ **Built-in TypeScript**: Native TypeScript support
- ✅ **Hot Reload**: Faster development cycles
- ✅ **Error Handling**: Automatic error boundaries

### **Architecture Benefits**
- ✅ **Scalability**: Better project organization
- ✅ **SEO**: Server-side rendering capabilities
- ✅ **Deployment**: Vercel/Netlify optimization
- ✅ **API Integration**: Built-in API routes (unused but available)

---

## 🎯 **Current Status & Recommendations**

### **Completed Features**
- ✅ Complete Next.js 14 App Router migration
- ✅ i18n integration across all auth pages
- ✅ Tailwind CSS + Shadcn/ui component system
- ✅ JWT authentication with middleware protection
- ✅ API client with proper error handling
- ✅ TypeScript configuration and type safety
- ✅ Responsive design implementation

### **Recommendations**
1. **Complete i18n**: Add translations for landing page and admin sections
2. **Add Loading States**: Implement loading.tsx for all routes
3. **Error Boundaries**: Add error.tsx for better error handling
4. **Performance Monitoring**: Add performance tracking
5. **Testing**: Implement integration tests for critical paths

The migration successfully modernizes the frontend architecture while maintaining all existing functionality and improving performance, developer experience, and scalability.