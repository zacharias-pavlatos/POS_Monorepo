// settings/sessions/sessions-settings.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';

import { Loader2, Monitor, Radio, Smartphone, Trash2 } from 'lucide-react';
import { UAParser } from 'ua-parser-js';

import { authClient } from '@/lib/auth-client';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@repo/ui/components/item';
import { Separator } from '@repo/ui/components/separator';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@repo/ui/components/empty';

interface Session {
  id: string;
  token: string;
  userAgent?: string;
  createdAt: Date;
}

function SessionsSettings() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log(sessions);

  useEffect(() => {
    async function load() {
      const [sessionRes, sessionsRes] = await Promise.all([
        authClient.getSession(),
        authClient.listSessions(),
      ]);

      setCurrentSessionToken(sessionRes.data?.session.id ?? null);
      setSessions(sessionsRes.data ?? []);
      setIsLoading(false);
    }

    load();
  }, []);

  const otherSessions = sessions.filter(s => s.id !== currentSessionToken);
  const currentSession = sessions.find(s => s.id === currentSessionToken);

  async function revokeOtherSessions() {
    await authClient.revokeOtherSessions();
    setSessions(prev => prev.filter(s => s.id === currentSessionToken));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">Sessions</h1>
        <p className="text-muted-foreground">Manage your active sessions</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Session</CardTitle>
          </CardHeader>
          <CardContent>
            {currentSession && <SessionCard session={currentSession} isCurrentSession />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Other Sessions</CardTitle>
            <CardDescription>
              If you see a session you don't recognize, sign out immediately. Always keep
              your account secure by regularly reviewing your active sessions.
            </CardDescription>
            <div className="flex items-center justify-between">
              {otherSessions.length > 0 && (
                <Button variant="destructive" size="sm" onClick={revokeOtherSessions}>
                  Revoke All
                </Button>
              )}
            </div>
          </CardHeader>

          {otherSessions.length === 0 ? (
            <EmptySessions />
          ) : (
            <CardContent>
              {otherSessions.map((session, index) => (
                <Fragment key={session.id}>
                  {index !== 0 && <Separator />}
                  <SessionCard
                    session={session}
                    onRevoke={() =>
                      setSessions(prev => prev.filter(s => s.id !== session.id))
                    }
                  />
                </Fragment>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  isCurrentSession = false,
  onRevoke,
}: {
  session: Session;
  isCurrentSession?: boolean;
  onRevoke?: () => void;
}) {
  const [isRevoking, setIsRevoking] = useState(false);
  const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null;

  function getBrowserInfo() {
    if (!userAgentInfo) return 'Unknown Device';

    const { browser, os } = userAgentInfo;
    if (!browser.name && !os.name) return 'Unknown Device';
    if (!browser.name) return os.name ?? 'Unknown';
    if (!os.name) return browser.name;

    return `${browser.name} on ${os.name}`;
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  async function revokeSession() {
    setIsRevoking(true);
    try {
      await authClient.revokeSession({ token: session.token });
      onRevoke?.();
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <Item className="px-0 py-6">
      <ItemMedia variant="default">
        {userAgentInfo?.device.type === 'mobile' ? (
          <Smartphone className="text-muted-foreground h-5 w-5" />
        ) : (
          <Monitor className="text-muted-foreground h-5 w-5" />
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{getBrowserInfo()}</ItemTitle>
        <ItemDescription>{formatDate(session.createdAt)}</ItemDescription>
      </ItemContent>
      {!isCurrentSession ? (
        <ItemActions>
          <Button
            size="sm"
            variant="outline"
            onClick={revokeSession}
            disabled={isRevoking}
          >
            Revoke
            {isRevoking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </ItemActions>
      ) : (
        <Badge
          variant="default"
          className="border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20"
        >
          <span className="relative mr-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          Active
        </Badge>
      )}
    </Item>
  );
}

function EmptySessions() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Radio />
        </EmptyMedia>
        <EmptyTitle>No other sessions</EmptyTitle>
        <EmptyDescription>
          You only have one active session. Other sessions will appear here when you sign
          in from different devices.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default SessionsSettings;
