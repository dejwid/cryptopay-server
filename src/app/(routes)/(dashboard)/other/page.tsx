import { Heading, Text, Flex, Card } from "@radix-ui/themes";
import { MailIcon, SettingsIcon, TestTubeIcon } from "lucide-react";
import Link from "next/link";
import { getUserEmail } from "@/app/actions/actions";
import TestEmailButton from "@/app/components/TestEmailButton";

export default async function OtherPage() {
  const userEmail = await getUserEmail();
  
  const items = [
    {
      href: '/email-logs',
      label: 'Email Logs',
      description: 'View history of sent emails',
      icon: <MailIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="p-4">
      <Heading size="5" mb="4">Other</Heading>
      
      <div className="space-y-2">
        {items.map((item) => (
          <Link href={item.href} key={item.href}>
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <Flex align="center" gap="3">
                <div className="text-gray-500 dark:text-gray-400">
                  {item.icon}
                </div>
                <div>
                  <Text size="3" weight="medium" className="block">{item.label}</Text>
                  <Text size="2" color="gray">{item.description}</Text>
                </div>
              </Flex>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Email Testing Section */}
      <Card className="mt-6">
        <Flex direction="column" gap="3">
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <TestTubeIcon className="h-4 w-4 text-gray-500" />
              <Heading size="3">Email Testing</Heading>
            </Flex>
            <Text size="2" color="gray">Send a test email to verify your email configuration.</Text>
          </Flex>
          <TestEmailButton defaultEmail={userEmail || ''} />
        </Flex>
      </Card>
    </div>
  );
}
