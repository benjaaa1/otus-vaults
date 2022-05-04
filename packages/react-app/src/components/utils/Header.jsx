import { PageHeader, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import React from "react";
// displays a page header

export default function Header({link, title, subTitle}) {

  const location = useLocation();

  return (
    <div>
      <a href={link} target="_blank" rel="noopener noreferrer">
        <PageHeader
          title={title}
          subTitle={subTitle}
          style={{ cursor: "pointer" }}
        />
      </a>
      <Menu style={{ textAlign: "center", marginTop: 40 }} selectedKeys={[location.pathname]} mode="horizontal">
      <Menu.Item key="/">
        <Link to="/">Products</Link>
      </Menu.Item>
      <Menu.Item key="/portfolio">
        <Link to="/portfolio">Portfolio</Link>
      </Menu.Item>
      <Menu.Item key="/supervisors">
        <Link to="/supervisors">Supervisors</Link>
      </Menu.Item>
      </Menu>
    </div>
  );
}

Header.defaultProps = {
  link: "/products",
  title: "Otus",
  subTitle: "Degen Vaults",
}