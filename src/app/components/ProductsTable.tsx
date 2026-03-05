'use client';

import ArchiveProductButton from "@/app/components/ArchiveProductButton";
import {Product} from "@prisma/client";
import {Button, DropdownMenu, Table} from "@radix-ui/themes";
import {EllipsisIcon, Pen, ShareIcon, Eye} from "lucide-react";
import Link from "next/link";

export default function ProductsTable({products}:{products:Product[]}) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
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
                <Table.Cell>
                  <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline">
                    {p.name}
                  </Link>
                </Table.Cell>
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
                        <Link href={`/products/${p.id}`} className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </DropdownMenu.Item>
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {products.map(p => (
          <Link 
            key={p.id} 
            href={`/products/${p.id}`}
            className="block bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-lg dark:text-white">{p.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{p.usdCents && `${p.usdCents/100} USD`}</p>
              </div>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="ghost" size="1" onClick={(e) => e.preventDefault()}>
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
            </div>
            <div className="text-sm text-gray-500">
              {p.uploads.length} upload{p.uploads.length !== 1 ? 's' : ''}
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No products found
          </div>
        )}
      </div>
    </>
  );
}
