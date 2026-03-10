import Button from "./Button";
import InputField from "./InputField";
import Panel from "./Panel";
import ProductList from "./ProductList";
import Card from "./Card";
import {
  Home,
  Users,
  ShoppingCart,
  FileText,
  Star,
  Mail,
  Calendar,
  Bell,
  Settings,
  Activity,
} from "lucide-react";
import Loader from "../common/Loader";

const Components = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Main Content Area
      </h1>

      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Your content goes here. The sidebar is pinned by default. Click the pin
        icon to toggle between pinned and unpinned states.
      </p>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card
          title="Total Users"
          subtitle="Active this month"
          icon={<Users className="w-5 h-5" />}
          hoverable
        >
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              24.5K
            </span>
            <span className="text-sm text-green-600 dark:text-green-400">
              +12%
            </span>
          </div>
        </Card>

        <Card
          title="Revenue"
          subtitle="Monthly revenue"
          icon={<ShoppingCart className="w-5 h-5" />}
          hoverable
        >
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              $45.2K
            </span>
            <span className="text-sm text-green-600 dark:text-green-400">
              +8%
            </span>
          </div>
        </Card>

        <Card
          title="Projects"
          subtitle="Active projects"
          icon={<FileText className="w-5 h-5" />}
          hoverable
        >
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              18
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400">+3</span>
          </div>
        </Card>

        <Card
          title="Tasks"
          subtitle="Completed today"
          icon={<Activity className="w-5 h-5" />}
          hoverable
        >
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              156
            </span>
            <span className="text-sm text-green-600 dark:text-green-400">
              +23%
            </span>
          </div>
        </Card>
      </div>

      {/* Content Cards Grid using Card component */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => {
          // Different icons for variety
          const icons = [
            <Home className="w-5 h-5" />,
            <Star className="w-5 h-5" />,
            <Mail className="w-5 h-5" />,
            <Calendar className="w-5 h-5" />,
            <Bell className="w-5 h-5" />,
            <Settings className="w-5 h-5" />,
            <Users className="w-5 h-5" />,
            <ShoppingCart className="w-5 h-5" />,
            <FileText className="w-5 h-5" />,
          ];

          return (
            <Card
              key={item}
              title={`Card ${item}`}
              subtitle={`Category ${Math.ceil(item / 3)}`}
              icon={icons[item - 1]}
              hoverable
              onClick={() => console.log(`Card ${item} clicked`)}
            >
              <p className="text-gray-500 dark:text-gray-400">
                Sample content for card {item}. This demonstrates the layout
                with the sidebar and proper card component.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Updated {item} min ago
                </span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  View Details →
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Other components */}
      <div className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Component Showcase
        </h2>

        <div className="flex gap-4">
          <Button className="btn-primary">Primary Button</Button>
          <Button className="btn-secondary">Secondary Button</Button>
          <Button className="btn-outline">Outline Button</Button>
        </div>

        <div className="max-w-md">
          <InputField
            label="Sample Input"
            type="text"
            placeholder="Enter something..."
          />
        </div>

        <Panel
          title="Custom Panel"
          className="border-l-4 border-blue-500"
          titleClassName="text-blue-700 dark:text-blue-300"
        >
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              This panel demonstrates collapsible content with smooth
              animations.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Click the header to collapse/expand.
            </p>
          </div>
        </Panel>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Product List
          </h2>
          <ProductList />
          <Loader />
        </div>
      </div>
    </div>
  );
};

export default Components;
