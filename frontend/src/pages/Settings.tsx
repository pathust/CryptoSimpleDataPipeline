import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Bell, Shield, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your platform preferences and configurations</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue="Admin User" className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="admin@cryptoflow.io" className="bg-muted/30" />
            </div>
            <Button className="w-full">Save Changes</Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Pipeline Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified when pipelines fail</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Storage Warnings</p>
                <p className="text-xs text-muted-foreground">Alert when storage reaches threshold</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Daily Reports</p>
                <p className="text-xs text-muted-foreground">Receive daily summary emails</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">API Key Rotation</p>
                <p className="text-xs text-muted-foreground">Auto-rotate keys every 30 days</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline" className="w-full mt-4">
              Regenerate API Keys
            </Button>
          </div>
        </Card>

        {/* Data Settings */}
        <Card className="glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-Sync</p>
                <p className="text-xs text-muted-foreground">Keep data synchronized in real-time</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Compression</p>
                <p className="text-xs text-muted-foreground">Compress old data to save space</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="destructive" className="w-full mt-4">
              Clear Cache
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
