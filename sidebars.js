// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  ecosystemSidebar: [
    "index",
    "getting-started",
    "packages",
    "upgrading-to-v4",
    "ecosystem",
    {
      type: "category",
      label: "Foundations",
      collapsed: true,
      items: [
        {
          type: "category",
          label: "eventStream",
          link: { type: "doc", id: "eventStream/introduction" },
          items: [
            "eventStream/introduction",
            "eventStream/api",
            "eventStream/examples",
            {
              type: "category",
              label: "nexSkills",
              link: { type: "doc", id: "eventStream/nexSkills/introduction" },
              items: [
                "eventStream/nexSkills/introduction",
                "eventStream/nexSkills/examples",
                "eventStream/nexSkills/structure",
              ],
            },
          ],
        },
        {
          type: "category",
          label: "nexAction",
          link: { type: "doc", id: "nexAction/introduction" },
          items: [
            "nexAction/introduction",
            "nexAction/installation",
            "nexAction/quickstart",
            "nexAction/triggers",
            "nexAction/api",
            "nexAction/events",
            "nexAction/troubleshooting",
            "nexAction/reference/options",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "insight",
      link: { type: "doc", id: "insight/introduction" },
      collapsed: true,
      items: [
        "insight/introduction",
        "insight/installation",
        "insight/quickstart",
        "insight/configuration",
        "insight/api",
        "insight/events",
        "insight/troubleshooting",
        {
          type: "category",
          label: "Reference",
          items: [
            "insight/reference/afflictions",
            "insight/reference/cures",
            "insight/reference/defences",
            "insight/reference/balances",
          ],
        },
      ],
    },
    "labs/index",
  ],
};

export default sidebars;
