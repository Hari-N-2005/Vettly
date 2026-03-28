# Vettly Frontend

React + Vite frontend application for the Tender Compliance Validator.

## 📋 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Button, Card, Modal, etc.
│   ├── upload/         # File upload, drop zone
│   ├── dashboard/      # Dashboard components
│   ├── compliance/     # Compliance display
│   ├── risks/          # Risk display
│   ├── requirements/   # Requirement components
│   ├── proposals/      # Proposal components
│   └── rfp/            # RFP management
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── services/           # API communication
├── store/              # Zustand state management
├── types/              # TypeScript interfaces
├── utils/              # Helper functions
├── styles/             # Global styles
└── assets/             # Images, logos, icons
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Testing

```bash
npm run test              # Run tests
npm run test:ui          # Interactive test UI
npm run test:coverage    # Coverage report
```

### Linting & Formatting

```bash
npm run lint             # Check for linting errors
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
```

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Dark theme** - Professional legal aesthetic
- **Responsive design** - Mobile-first approach

### Tailwind Configuration

See `tailwind.config.js` for custom colors:
- `legal-dark` - Main dark background
- `legal-slate` - Secondary background
- `legal-blue` - Primary accent
- `legal-gold` - Secondary accent

## 🔌 API Integration

API base URL configured in `.env.local`:

```
VITE_API_URL=http://localhost:3000/api
```

Services in `src/services/` handle API communication using Axios.

## 🎯 Main Features

- **RFP Upload** - Drag-and-drop PDF upload
- **Automatic Extraction** - AI-powered requirement extraction
- **Vendor Comparison** - Side-by-side proposal comparison
- **Compliance Dashboard** - Visual compliance metrics
- **Risk Detection** - Automated risk flagging
- **Project Management** - Organize and track RFP projects

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS breakpoints:
  - `sm` - 640px
  - `md` - 768px
  - `lg` - 1024px
  - `xl` - 1280px

## 🔐 Authentication

JWT-based authentication with token refresh mechanism.

## ♿ Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management

## 📦 Dependencies

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **TanStack Query** - Server state
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Validation

## 🤝 Contributing

1. Create a feature branch
2. Follow Prettier formatting
3. Run tests and linting
4. Submit pull request

## 📝 License

MIT
