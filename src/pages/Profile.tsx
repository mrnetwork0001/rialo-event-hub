import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Pencil,
  Save,
  X,
  MessageCircle,
  Lightbulb,
  Award,
  Wallet,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string;
  discord_username: string;
  wallet_address: string;
  avatar_url: string;
  created_at: string;
}

interface Badge {
  label: string;
  description: string;
  icon: typeof Award;
  earned: boolean;
  color: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [displayName, setDisplayName] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Stats
  const [commentCount, setCommentCount] = useState(0);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // No profile yet, create one
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            display_name: user.email?.split("@")[0] || "User",
          })
          .select()
          .single();
        if (insertError) throw insertError;
        const p = newProfile as any;
        setProfile(p);
        setDisplayName(p.display_name);
        setDiscordUsername(p.discord_username || "");
        setWalletAddress(p.wallet_address || "");
      } else if (error) {
        throw error;
      } else {
        const p = data as any;
        setProfile(p);
        setDisplayName(p.display_name);
        setDiscordUsername(p.discord_username || "");
        setWalletAddress(p.wallet_address || "");
      }
    } catch (err: any) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    const [comments, suggestions, votes] = await Promise.all([
      supabase
        .from("event_comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("suggestions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("suggestion_votes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    setCommentCount(comments.count ?? 0);
    setSuggestionCount(suggestions.count ?? 0);
    setVoteCount(votes.count ?? 0);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Validate wallet address if provided
      if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        toast.error("Invalid EVM wallet address");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || "User",
          discord_username: discordUsername.trim(),
          wallet_address: walletAddress.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated!");
      setEditing(false);
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getBadges = (): Badge[] => {
    return [
      {
        label: "First Comment",
        description: "Posted your first comment",
        icon: MessageCircle,
        earned: commentCount >= 1,
        color: "text-blue-500",
      },
      {
        label: "Conversationalist",
        description: "Posted 10+ comments",
        icon: MessageCircle,
        earned: commentCount >= 10,
        color: "text-blue-400",
      },
      {
        label: "Idea Starter",
        description: "Submitted your first suggestion",
        icon: Lightbulb,
        earned: suggestionCount >= 1,
        color: "text-yellow-500",
      },
      {
        label: "Visionary",
        description: "Submitted 5+ suggestions",
        icon: Lightbulb,
        earned: suggestionCount >= 5,
        color: "text-yellow-400",
      },
      {
        label: "Supporter",
        description: "Voted on 5+ suggestions",
        icon: Award,
        earned: voteCount >= 5,
        color: "text-green-500",
      },
      {
        label: "Power Voter",
        description: "Voted on 20+ suggestions",
        icon: Award,
        earned: voteCount >= 20,
        color: "text-green-400",
      },
      {
        label: "Wallet Connected",
        description: "Linked your EVM wallet",
        icon: Wallet,
        earned: !!profile?.wallet_address,
        color: "text-purple-500",
      },
      {
        label: "Discord Linked",
        description: "Linked your Discord account",
        icon: AtSign,
        earned: !!profile?.discord_username,
        color: "text-indigo-500",
      },
    ];
  };

  if (!user) return null;

  const badges = getBadges();
  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);

  const truncateWallet = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-56">
        <div className="mx-auto max-w-3xl px-6 py-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                My Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your profile and see your activity
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">
              Loading profile...
            </p>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="font-display text-lg">
                    Profile Info
                  </CardTitle>
                  {!editing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(false);
                          setDisplayName(profile?.display_name || "");
                          setDiscordUsername(profile?.discord_username || "");
                          setWalletAddress(profile?.wallet_address || "");
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary uppercase">
                      {(profile?.display_name || "U")[0]}
                    </div>
                    <div className="flex-1">
                      {editing ? (
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={50}
                          />
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl font-semibold text-foreground">
                            {profile?.display_name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Linked Accounts */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    {/* Discord */}
                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AtSign className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-medium text-foreground">
                          Discord
                        </span>
                      </div>
                      {editing ? (
                        <Input
                          value={discordUsername}
                          onChange={(e) =>
                            setDiscordUsername(e.target.value)
                          }
                          placeholder="username#1234"
                          maxLength={50}
                        />
                      ) : profile?.discord_username ? (
                        <p className="text-sm text-foreground">
                          {profile.discord_username}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not linked
                        </p>
                      )}
                    </div>

                    {/* Wallet */}
                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium text-foreground">
                          EVM Wallet
                        </span>
                      </div>
                      {editing ? (
                        <Input
                          value={walletAddress}
                          onChange={(e) =>
                            setWalletAddress(e.target.value)
                          }
                          placeholder="0x..."
                          maxLength={42}
                        />
                      ) : profile?.wallet_address ? (
                        <p className="text-sm text-foreground font-mono">
                          {truncateWallet(profile.wallet_address)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not linked
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Member since{" "}
                    {new Date(
                      profile?.created_at || ""
                    ).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              {/* Activity Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/50">
                  <CardContent className="pt-6 text-center">
                    <MessageCircle className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {commentCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Comments
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="pt-6 text-center">
                    <Lightbulb className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {suggestionCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suggestions
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="pt-6 text-center">
                    <Award className="h-5 w-5 mx-auto text-green-500 mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {voteCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Votes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Badges */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Badges ({earnedBadges.length}/{badges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Earned */}
                  {earnedBadges.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Earned
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {earnedBadges.map((badge) => (
                          <div
                            key={badge.label}
                            className="flex flex-col items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center"
                          >
                            <badge.icon
                              className={cn("h-6 w-6", badge.color)}
                            />
                            <span className="text-xs font-medium text-foreground">
                              {badge.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locked */}
                  {unearnedBadges.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Locked
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {unearnedBadges.map((badge) => (
                          <div
                            key={badge.label}
                            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/30 p-3 text-center opacity-50"
                            title={badge.description}
                          >
                            <badge.icon className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {badge.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
