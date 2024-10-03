"use client";
import useCheckRole from "@/app/auth/useCheckRole";
import Navbar2 from "@/app/components/Navbar2";
import { PageLoading } from "@/app/components/PageLoading";
import { Button, Pagination, ScrollArea, Table, Tooltip } from "@mantine/core";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import { ApiResponsePerson, Person } from "@/app/utils/types";
import AddUserModal from "@/app/components/AddUserModal";
import { useDisclosure } from "@mantine/hooks";
import { getDecodedToken } from "@/app/auth/getDecodedToken";
import DecodeCookie from "@/app/auth/DecodeCookie";
import { getPlainCookie } from "@/app/auth/getPlainCookie";
import { notifications } from "@mantine/notifications";
import FilterUsersDrawer from "@/app/components/FilterUsersDrawer";

function page() {
  const authorized = useCheckRole("ROLE_ADMIN");

  const [response, setResponse] = useState<ApiResponsePerson | null>(null);

  const [elements, setElements] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>("");

  const [refreshUsers, setRefreshUsers] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [
    openedAddUserModal,
    { open: openAddUserModal, close: closeAddUserModal },
  ] = useDisclosure(false);
  const [
    openedFilterDrawer,
    { open: openFilterDrawer, close: closeFilterDrawer },
  ] = useDisclosure(false);

  useEffect(() => {
    setRefreshUsers(false);
    if (authorized === "AUTHORIZED" || refreshUsers) {
      fetchData();
    }
  }, [authorized, filterQuery, refreshUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterQuery]);

  //Fetch users
  const fetchData = useCallback(async () => {
    // console.log(`${process.env.NEXT_PUBLIC_API_URL}/persons/filter?page=${currentPage}&size=${pageSize}${filterQuery}`);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/persons/filter?page=${
          currentPage - 1
        }&size=${pageSize}${filterQuery}`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        setTotalPages(responseData.totalPages);
        setResponse(responseData);
      } else {
        const errorData = await response.json();
        if (errorData) {
          console.log(errorData);
        }
      }
    } catch (error) {
      console.log("Error attempting to fetch data: ", error);
    }
  }, [filterQuery, currentPage]);

  useEffect(() => {
    if (response) {
      const transformedElements = response.content.map((person) => ({
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        indexNumber: person.indexNumber,
        roles: `${person.admin ? "(Admin) " : ""}${
          person.worker ? "(Radnik) " : ""
        }${person.professor ? "(Profesor) " : ""}${
          person.student ? "(Student) " : ""
        }`,
      }));
      setElements(transformedElements);
    }
  }, [response]);

  // useEffect(() => {
  //   console.log("Elements: ", elements);
  // }, [elements]);

  const rows = elements.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td className={styles.column}>{element.firstName}</Table.Td>
      <Table.Td className={styles.column}>{element.lastName}</Table.Td>
      <Table.Td className={styles.column}>{element.email}</Table.Td>
      <Table.Td className={styles.column}>{element.indexNumber}</Table.Td>
      <Table.Td className={styles.column}>{element.roles}</Table.Td>
      <Table.Td className={styles.column}>
        <div className={styles.crudButtonsContainer}>
          <Tooltip label="Uredi korisnika">
            <Button color="green">
              <Image
                src="/assets/svgs/edit.svg"
                alt="Edit"
                width={24}
                height={24}
              ></Image>
            </Button>
          </Tooltip>
          <Tooltip label="Obriši korisnika">
            <Button color="red">
              <Image
                src="/assets/svgs/trash.svg"
                alt="Delete"
                width={24}
                height={24}
              ></Image>
            </Button>
          </Tooltip>
        </div>
      </Table.Td>
    </Table.Tr>
  ));

  if (authorized === "CHECKING") {
    return <PageLoading />;
  }

  return (
    <div>
      <Navbar2 />
      <div className={styles.mainDiv}>
        <div className={styles.pageContent}>
          <div className={styles.addAndFilterBtnContainer}>
            <Tooltip label="Dodaj korisnika">
              <Button onClick={openAddUserModal}>
                <Image
                  src="/assets/svgs/plus.svg"
                  alt="Plus Icon"
                  width={24}
                  height={24}
                />
              </Button>
            </Tooltip>
            <Tooltip label="Filtriraj">
              <Button variant="filled" color="gray" onClick={openFilterDrawer}>
                <Image
                  src="/assets/svgs/filtering.svg"
                  alt="Filter"
                  width={24}
                  height={24}
                />
              </Button>
            </Tooltip>
            <Button
              onClick={() =>
                notifications.show({
                  withBorder: true,
                  title: "Default notification",
                  message: "Do not forget to star Mantine on GitHub! 🌟",
                })
              }
            >
              Show notification
            </Button>
          </div>

          <ScrollArea className={styles.borderColor}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className={styles.column}>Ime</Table.Th>
                  <Table.Th className={styles.column}>Prezime</Table.Th>
                  <Table.Th className={styles.column}>Email</Table.Th>
                  <Table.Th className={styles.column}>Indeks</Table.Th>
                  <Table.Th className={styles.column}>Prava</Table.Th>
                  <Table.Th className={styles.column}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
        </div>
        <Pagination
          value={currentPage}
          onChange={setCurrentPage}
          total={totalPages}
          mt={50}
        />
        <div className={styles.bottomSpace}></div>
      </div>

      <AddUserModal
        opened={openedAddUserModal}
        open={openAddUserModal}
        close={closeAddUserModal}
        creatorRole="ROLE_ADMIN"
        setRefreshUsers={setRefreshUsers}
      />
      <FilterUsersDrawer
        opened={openedFilterDrawer}
        open={openFilterDrawer}
        close={closeFilterDrawer}
        creatorRole="ROLE_ADMIN"
        setFilterQuery={setFilterQuery}
      />
    </div>
  );
}

export default page;
