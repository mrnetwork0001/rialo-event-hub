import { useState } from "react";
import { Bell, Phone, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DbEvent } from "@/lib/supabase-events";

interface RemindMeDialogProps {
  event: DbEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RemindMeDialog = ({ event, open, onOpenChange }: RemindMeDialogProps) => {
  const [channel, setChannel] = useState<"sms" | "telegram">("telegram");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = contact.trim();

    if (!trimmed) {
      toast.error("Please enter your contact info.");
      return;
    }

    if (channel === "sms" && !/^\+\d{7,15}$/.test(trimmed)) {
      toast.error("Enter a valid phone number with country code (e.g. +1234567890).");
      return;
    }

    if (channel === "telegram" && !/^@?[a-zA-Z0-9_]{5,32}$/.test(trimmed)) {
      toast.error("Enter a valid Telegram username (e.g. @username).");
      return;
    }

    const remindAt = new Date(new Date(event.event_date).getTime() - 5 * 60 * 1000).toISOString();

    setLoading(true);
    const { error } = await supabase.from("reminders" as any).insert({
      event_id: event.id,
      channel,
      contact: channel === "telegram" ? trimmed.replace(/^@/, "") : trimmed,
      remind_at: remindAt,
    } as any);
    setLoading(false);

    if (error) {
      toast.error("Failed to set reminder. Please try again.");
      console.error(error);
      return;
    }

    toast.success(`Reminder set! You'll be notified 5 min before the event via ${channel === "sms" ? "SMS" : "Telegram"}.`);
    setContact("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Remind Me
          </DialogTitle>
          <DialogDescription>
            Get notified 5 minutes before <span className="font-semibold text-foreground">{event.title}</span> starts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Notification channel</Label>
            <RadioGroup
              value={channel}
              onValueChange={(v) => {
                setChannel(v as "sms" | "telegram");
                setContact("");
              }}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2.5 has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5 transition-colors">
                <RadioGroupItem value="telegram" />
                <Send className="h-4 w-4 text-primary/70" />
                <span className="text-sm font-medium">Telegram</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2.5 has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5 transition-colors">
                <RadioGroupItem value="sms" />
                <Phone className="h-4 w-4 text-primary/70" />
                <span className="text-sm font-medium">SMS</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">
              {channel === "sms" ? "Phone number (with country code)" : "Telegram username"}
            </Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={channel === "sms" ? "+1234567890" : "@username"}
              autoComplete="off"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting reminder…" : "Set Reminder"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RemindMeDialog;
