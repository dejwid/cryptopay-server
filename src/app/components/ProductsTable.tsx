import ArchiveProductButton from "@/app/components/ArchiveProductButton";
import {Product} from "@prisma/client";
import {Button, DropdownMenu, Table} from "@radix-ui/themes";
import {EllipsisIcon, Pen, ShareIcon} from "lucide-react";
import Link from "next/link";

export default function ProductsTable({products}:{products:Product[]}) {
  return (
    <>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.RowHeaderCell>Name</Table.RowHeaderCell>
            <Table.RowHeaderCell>Price (USD)</Table.RowHeaderCell>
            <Table.RowHeaderCell>Uploads</Table.RowHeaderCell>
            <Table.RowHeaderCell>Actions</Table.RowHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map(p => (
            <Table.Row key={p.id}>
              <Table.Cell>{p.name}</Table.Cell>
              <Table.Cell>{p.usdCents && `${p.usdCents/100} USD`}</Table.Cell>
              <Table.Cell>
                {p.uploads.length}
              </Table.Cell>
              <Table.Cell className="flex justify-center">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button variant="ghost">
                      <EllipsisIcon />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item>
                      <Link href={'/product/'+p.id+'/0000'}>Preview</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <Link href={'/products/edit/'+p.id}>Edit</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <Link href={'/buy/'+p.id}>Pay link</Link>
                    </DropdownMenu.Item>
                    {!p.archivedAt && (
                      <>
                        <DropdownMenu.Separator />
                        <ArchiveProductButton productId={p.id} />
                      </>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </>
  );
}