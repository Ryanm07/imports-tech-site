"""Original, editable MT-09 visual model, dimensions in metres.

The silhouette follows the research gallery's F5 open-tripod photograph. Only
the nominal closed diameter and advertised height range are documented. The
open footprint, internal dimensions and GoPro-to-1/4 adapter are approximations,
not manufacturing geometry. This module does not alter an existing scene.
"""

import math
import os

import bpy
from mathutils import Vector


def build_mt09(scene):
    """Link an independent UlanziMT09 hierarchy into scene and return its root.

    Axes: X width, Y depth, Z up. Ground is Z=0. The U200 should be placed with
    its bottom mounting surface at root['mount_height_m'] (0.145 m). Its female
    hole covers the small male stud above that plane. No animation is created.
    """
    root = bpy.data.objects.new("UlanziMT09", None)
    scene.collection.objects.link(root)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.018
    root["model"] = "Ulanzi MT-09 / 1602 — visual reconstruction"
    root["mount_height_m"] = 0.145
    root["base_radius_m"] = 0.071
    root["published_closed_diameter_m"] = 0.030
    root["published_open_height_range_m"] = [0.102, 0.224]
    root["estimated_geometry"] = (
        "Photographic reconstruction: footprint, leg length, hinge angles, "
        "tube diameters and all adapter dimensions estimated. Nominal closed "
        "diameter 30 mm; advertised open height 102–224 mm. Complete MT09 "
        "represented with a separate illustrative GoPro-to-1/4 male adapter."
    )
    root["reference"] = (
        "https://ulanzi.com.pl/2910-thickbox_default/"
        "statyw-do-kamer-sportowych-ulanzi-mt-09.jpg"
    )
    root["interaction"] = "Static tripod. No animation required."

    def material(name, color, roughness, metallic=0.0, micro=False):
        mat = bpy.data.materials.new("MT09_" + name)
        mat.diffuse_color = (*color, 1.0)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if micro:
            tex = mat.node_tree.nodes.new("ShaderNodeTexCoord")
            noise = mat.node_tree.nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 2350.0
            noise.inputs["Detail"].default_value = 1.1
            bump = mat.node_tree.nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = 0.23
            bump.inputs["Distance"].default_value = 0.000055
            mat.node_tree.links.new(tex.outputs["Object"], noise.inputs["Vector"])
            mat.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
            mat.node_tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
            mat["web_export_note"] = (
                "Optional procedural micro-bump is Blender-only until baked; "
                "base color and roughness export without textures."
            )
        return mat

    shell_mat = material("Black_ABS", (0.026, 0.029, 0.037), 0.39)
    inner_mat = material("Inner_ABS", (0.019, 0.022, 0.029), 0.54)
    grip_mat = material("Textured_Grip", (0.034, 0.038, 0.045), 0.70, micro=True)
    rubber_mat = material("Rubber", (0.013, 0.016, 0.021), 0.82)
    metal_mat = material("Anodized_Aluminium", (0.043, 0.048, 0.059), 0.28, 0.68)
    red_mat = material("Red_Accent", (0.56, 0.009, 0.022), 0.29, 0.30)
    silver_mat = material("Hardware_Steel", (0.34, 0.39, 0.43), 0.24, 0.88)
    logo_mat = material("White_Print", (0.77, 0.81, 0.86), 0.52)

    def empty(name, parent=root):
        obj = bpy.data.objects.new(name, None)
        scene.collection.objects.link(obj)
        obj.parent = parent
        obj.empty_display_size = 0.008
        return obj

    def mesh_obj(name, verts, faces, mat, parent=root, smooth=False, bevel=0.0):
        mesh = bpy.data.meshes.new(name + "_Mesh")
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        obj.parent = parent
        mesh.materials.append(mat)
        for poly in mesh.polygons:
            poly.use_smooth = smooth
        if bevel:
            mod = obj.modifiers.new("Small moulded edge", "BEVEL")
            mod.width = bevel
            mod.segments = 1
            mod.limit_method = "ANGLE"
            mod.angle_limit = math.radians(35)
        return obj

    def box(name, center, dims, mat, parent=root, bevel=0.0):
        x, y, z = (d * 0.5 for d in dims)
        verts = [(-x,-y,-z), (x,-y,-z), (x,y,-z), (-x,y,-z),
                 (-x,-y,z), (x,-y,z), (x,y,z), (-x,y,z)]
        faces = [(3,2,1,0), (0,1,5,4), (1,2,6,5),
                 (2,3,7,6), (3,0,4,7), (4,5,6,7)]
        obj = mesh_obj(name, verts, faces, mat, parent, bevel=bevel)
        obj.location = center
        return obj

    def cylinder(name, start, end, radius, mat, parent=root, sides=24,
                 radius_end=None, bevel=0.0):
        start, end = Vector(start), Vector(end)
        direction = end - start
        depth = direction.length
        r2 = radius if radius_end is None else radius_end
        verts = []
        for r, zz in ((radius, -depth * 0.5), (r2, depth * 0.5)):
            for i in range(sides):
                a = 2 * math.pi * i / sides
                verts.append((r * math.cos(a), r * math.sin(a), zz))
        faces = [tuple(reversed(range(sides))), tuple(range(sides, sides * 2))]
        for i in range(sides):
            j = (i + 1) % sides
            faces.append((i, j, j+sides, i+sides))
        obj = mesh_obj(name, verts, faces, mat, parent, bevel=bevel)
        obj.location = (start + end) * 0.5
        obj.rotation_mode = "QUATERNION"
        obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
        for poly in obj.data.polygons[2:]:
            poly.use_smooth = True
        return obj

    def beam(name, start, end, width, depth, mat, parent):
        start, end = Vector(start), Vector(end)
        obj = box(name, (start + end) * 0.5,
                  (width, depth, (end-start).length), mat, parent, 0.00015)
        obj.rotation_mode = "QUATERNION"
        obj.rotation_quaternion = (end-start).to_track_quat("Z", "Y")
        return obj

    # The center tube stops above the ground, as in the open-tripod photo.
    column = empty("MT09_Column")
    cylinder("MT09_LowerTube", (0,0,0.028), (0,0,0.096), 0.0107,
             metal_mat, column, sides=32, bevel=0.0003)
    cylinder("MT09_LowerEndCap", (0,0,0.025), (0,0,0.033), 0.0121,
             shell_mat, column, sides=32, bevel=0.0005)
    cylinder("MT09_TelescopicInner", (0,0,0.091), (0,0,0.108), 0.0087,
             metal_mat, column, sides=28, bevel=0.0002)
    cylinder("MT09_HingeCollar", (0,0,0.094), (0,0,0.107), 0.0150,
             shell_mat, column, sides=40, bevel=0.0005)
    cylinder("MT09_RedAnnulus", (0,0,0.107), (0,0,0.1083), 0.0149,
             red_mat, column, sides=40, bevel=0.0001)
    cylinder("MT09_HeadBase", (0,0,0.1083), (0,0,0.110), 0.0147,
             shell_mat, column, sides=40, bevel=0.0003)

    # Each shell is curved across its width: three pieces could close into a
    # compact cylindrical grip, unlike a conventional three-rod floor tripod.
    for index in range(3):
        angle = -math.pi / 2 + index * 2 * math.pi / 3
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        tangent = Vector((-math.sin(angle), math.cos(angle), 0))
        normal = (radial * 0.847 + Vector((0,0,0.532))).normalized()
        leg_root = empty("MT09_Leg_%02d" % (index+1))
        leg_root["pose"] = "Open: hinges above, toes down and outward"

        def leg_point(t, u, inward=0.0):
            # Slightly narrowed ends and gentle convex outer cross-section.
            end_round = 0.72 if t < 0.001 or t > 0.999 else 1.0
            half_width = (0.0106 - 0.0024*t) * end_round
            center = radial * (0.009 + 0.057*t) + Vector((0,0,0.094-0.091*t))
            camber = 0.0036 * (1-u*u)
            return center + tangent*(u*half_width) + normal*(camber+inward)

        ts = [0.0, 0.035, 0.15, 0.85, 0.965, 1.0]
        us = [-1.0, -0.8, -0.5, 0.0, 0.5, 0.8, 1.0]
        rows, cols = len(ts), len(us)
        verts = []
        for side_offset in (0.0, -0.0017):
            for t in ts:
                for u in us:
                    verts.append(tuple(leg_point(t, u, side_offset)))
        side_count = rows * cols
        faces = []
        for i in range(rows-1):
            for j in range(cols-1):
                a = i*cols+j
                faces.append((a, a+cols, a+cols+1, a+1))
                b = a+side_count
                faces.append((b+1, b+cols+1, b+cols, b))
        boundary = list(range(cols))
        boundary += [i*cols+cols-1 for i in range(1, rows)]
        boundary += list(reversed(range((rows-1)*cols, rows*cols-1)))
        boundary += [i*cols for i in reversed(range(1, rows-1))]
        for k, a in enumerate(boundary):
            b = boundary[(k+1) % len(boundary)]
            faces.append((a, b, b+side_count, a+side_count))
        shell = mesh_obj("MT09_LegShell_%02d" % (index+1), verts, faces,
                         shell_mat, leg_root, smooth=True, bevel=0.0002)
        shell["construction"] = "Curved shell with open inner reinforcement ribs"

        # Long inset, finely textured grip panel, rounded at its two ends.
        panel_ts = [0.10, 0.12, 0.17, 0.82, 0.87, 0.89]
        panel_widths = [0.25, 0.58, 0.68, 0.68, 0.58, 0.25]
        pverts = []
        for t, w in zip(panel_ts, panel_widths):
            for u in (-w, -w*0.5, 0, w*0.5, w):
                pverts.append(tuple(leg_point(t, u, 0.00024)))
        pfaces = []
        for i in range(len(panel_ts)-1):
            for j in range(4):
                a = i*5+j
                pfaces.append((a, a+5, a+6, a+1))
        panel = mesh_obj("MT09_GripPanel_%02d" % (index+1), pverts, pfaces,
                         grip_mat, leg_root, smooth=True)
        solid = panel.modifiers.new("Inset pad thickness", "SOLIDIFY")
        solid.thickness = 0.0002
        solid.offset = -1

        # Diagonal inner ribs are visible on the rear two legs. Use actual
        # geometry, so the characteristic triangular web survives GLB export.
        for side in (-1, 1):
            beam("MT09_InnerRim_%02d_%s" % (index+1, side),
                 leg_point(0.07, side*0.90, -0.0022),
                 leg_point(0.94, side*0.90, -0.0022),
                 0.0013, 0.0030, inner_mat, leg_root)
        beam("MT09_InnerSpine_%02d" % (index+1),
             leg_point(0.09, 0, -0.0034), leg_point(0.94, 0, -0.0034),
             0.0012, 0.0026, inner_mat, leg_root)
        for j in range(6):
            t0 = 0.14+j*0.117
            t1 = t0+0.098
            for side in (-1, 1):
                beam("MT09_Rib_%02d_%02d_%s" % (index+1, j, side),
                     leg_point(t0, 0, -0.0030),
                     leg_point(t1, side*0.84, -0.0027),
                     0.00115, 0.0025, inner_mat, leg_root)

        # Pivot pin across the top of the leg and a small moulded toe pad.
        pivot = radial*0.0103 + Vector((0,0,0.094))
        cylinder("MT09_LegPivot_%02d" % (index+1),
                 pivot-tangent*0.009, pivot+tangent*0.009, 0.0031,
                 shell_mat, leg_root, sides=16, bevel=0.0002)
        for sign in (-1,1):
            cylinder("MT09_PivotCap_%02d_%s" % (index+1,sign),
                     pivot+tangent*(sign*0.0088),
                     pivot+tangent*(sign*0.0092), 0.00155,
                     metal_mat, leg_root, sides=12)
        toe = box("MT09_RubberToe_%02d" % (index+1),
                  radial*0.065 + Vector((0,0,0.00125)),
                  (0.0125,0.011,0.0025), rubber_mat, leg_root, 0.0008)
        toe.rotation_euler.z = angle-math.pi/2

    head = empty("MT09_GoProHead")

    def finger(name, xcenter, width, bottom, pivot_z, upside_down, mat, parent):
        """Extrude a rounded-ended GoPro finger in the X direction."""
        radius = 0.0054
        outline = []
        if not upside_down:
            outline.extend([(-radius,bottom), (radius,bottom)])
            for j in range(13):
                a = math.pi*j/12
                outline.append((radius*math.cos(a), pivot_z+radius*math.sin(a)))
        else:
            outline.extend([(radius,bottom), (-radius,bottom)])
            for j in range(13):
                a = math.pi+math.pi*j/12
                outline.append((radius*math.cos(a), pivot_z+radius*math.sin(a)))
        n = len(outline)
        verts = [(xcenter-width*0.5,y,z) for y,z in outline]
        verts += [(xcenter+width*0.5,y,z) for y,z in outline]
        faces = [tuple(reversed(range(n))), tuple(range(n,n*2))]
        for j in range(n):
            k = (j+1) % n
            faces.append((j,k,k+n,j+n))
        return mesh_obj(name, verts, faces, mat, parent, bevel=0.0003)

    for index, xpos in enumerate((-0.006, 0.0, 0.006)):
        finger("MT09_GoProProng_%02d" % (index+1), xpos, 0.0026,
               0.109, 0.120, False, shell_mat, head)
    cylinder("MT09_ThumbScrewAxle", (-0.012,0,0.120), (0.026,0,0.120),
             0.00225, silver_mat, head, sides=20)
    cylinder("MT09_ThumbScrewSleeve", (0.010,0,0.120), (0.030,0,0.120),
             0.0043, shell_mat, head, sides=24, bevel=0.0003)
    cylinder("MT09_ThumbScrewKnob", (0.029,0,0.120), (0.036,0,0.120),
             0.0080, shell_mat, head, sides=8, bevel=0.0010)
    cylinder("MT09_ThumbScrewNut", (-0.011,0,0.120), (-0.0085,0,0.120),
             0.0040, silver_mat, head, sides=6, bevel=0.0002)

    # This is intentionally a separately named adapter, not a native MT09
    # ball head or an undocumented factory MT09/U200 kit.
    adapter = empty("MT09_ADAPTER_GoPro_to_QuarterInch")
    adapter["status"] = "Illustrative adapter; actual user attachment unconfirmed"
    adapter["mount_height_m"] = 0.145
    for index, xpos in enumerate((-0.003, 0.003)):
        finger("MT09_AdapterFinger_%02d" % (index+1), xpos, 0.0024,
               0.139, 0.120, True, inner_mat, adapter)
    cylinder("MT09_AdapterPlatform", (0,0,0.1375), (0,0,0.144),
             0.0120, shell_mat, adapter, sides=32, bevel=0.00055)
    cylinder("MT09_AdapterRubberPad", (0,0,0.144), (0,0,0.145),
             0.0108, rubber_mat, adapter, sides=32, bevel=0.00015)
    cylinder("MT09_QuarterInchMaleStud", (0,0,0.1445), (0,0,0.150),
             0.003175, silver_mat, adapter, sides=20, bevel=0.00015)
    for index in range(4):
        zz = 0.146 + index*0.00085
        cylinder("MT09_StudThreadSuggestion_%02d" % (index+1),
                 (0,0,zz), (0,0,zz+0.00024), 0.00320,
                 metal_mat, adapter, sides=20)

    font_curve = bpy.data.curves.new("MT09_Logo_Print_Curve", "FONT")
    font_curve.body = "ulanzi"
    font_curve.size = 0.0046
    font_curve.align_x = "CENTER"
    font_curve.align_y = "CENTER"
    font_curve.extrude = 0.000018
    font_curve.resolution_u = 3
    font_path = "C:/Windows/Fonts/arialbd.ttf"
    if os.path.exists(font_path):
        font_curve.font = bpy.data.fonts.load(font_path, check_existing=True)
    font_obj = bpy.data.objects.new("MT09_WhiteLogo", font_curve)
    scene.collection.objects.link(font_obj)
    font_obj.parent = column
    font_obj.location = (0,-0.01504,0.101)
    font_obj.rotation_euler = (math.pi/2,0,0)
    font_curve.materials.append(logo_mat)
    return root
