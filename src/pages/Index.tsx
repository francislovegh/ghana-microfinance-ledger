
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, BarChart4, PiggyBank, CreditCard } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Ghana Microfinance Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Savings</p>
                <p className="text-2xl font-bold text-gray-900">₵ 245,000</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <PiggyBank className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+2.5% from last month</p>
          </Card>

          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">153</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">-1.2% from last month</p>
          </Card>

          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+3.1% from last month</p>
          </Card>

          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₵ 58,400</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+5.4% from last month</p>
          </Card>
        </div>

        {/* Recent Activities Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <Card className="overflow-hidden">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((item) => (
                  <li key={item} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`bg-${item % 2 === 0 ? 'blue' : 'green'}-100 p-2 rounded-full`}>
                            {item % 2 === 0 ? 
                              <PiggyBank className="h-5 w-5 text-blue-600" /> : 
                              <CreditCard className="h-5 w-5 text-green-600" />
                            }
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {item % 2 === 0 ? 'Deposit' : 'Loan Payment'} - {item * 1000} GHS
                          </p>
                          <p className="text-xs text-gray-500">
                            {item % 2 === 0 ? 'Savings Account' : 'Personal Loan'} - Customer #{100 + item}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {new Date().toLocaleDateString()} - {item} hour{item !== 1 ? 's' : ''} ago
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">New Savings Account</Button>
          <Button className="bg-green-600 hover:bg-green-700">Process Loan Application</Button>
          <Button className="bg-purple-600 hover:bg-purple-700">Register New Customer</Button>
          <Button variant="outline">Generate Reports</Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
