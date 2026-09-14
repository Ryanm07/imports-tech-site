"""Original floor-height studio adaptation, not a full-scale Ulanzi MT09.

Meters, native Z-up, front -Y, three rubber feet at ground Z=0. The compact
MT09 reconstruction remains unchanged; this independent support deliberately
uses an extended telescopic column and a broad footprint for the studio scene.
"""
import math

import bpy
from mathutils import Vector


def build_floor_stand(scene):
    root = bpy.data.objects.new('RecordingFloorStand', None)
    scene.collection.objects.link(root)
    root.empty_display_type = 'PLAIN_AXES'
    root.empty_display_size = .12
    root['model'] = 'Imports Tech floor stand — original studio adaptation'
    root['mount_height_m'] = 1.43
    root['base_radius_m'] = .44
    root['units'] = 'meters'
    root['native_front'] = '-Y'
    root['floor_height_m'] = 0.0
    root['design_note'] = ('Extended floor stand inspired by MT09 surface details. '
                           'Not the real MT09 product or manufacturing CAD. '
                           'Separate visual GoPro-to-quarter-inch adapter.')

    def material(name, color, roughness, metallic=0):
        mat = bpy.data.materials.new('FloorStand_' + name)
        mat.use_nodes = True
        mat.diffuse_color = (*color, 1)
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (*color, 1)
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        return mat

    metal = material('Anodized', (.035, .039, .045), .29, .72)
    shell = material('Black', (.022, .026, .033), .40)
    grip = material('Grip', (.045, .048, .054), .65)
    rubber = material('Rubber', (.012, .014, .018), .83)
    red = material('Red', (.49, .008, .018), .30, .32)
    steel = material('Steel', (.35, .39, .44), .25, .88)

    def mesh(name, verts, faces, mat, bevel=0):
        data = bpy.data.meshes.new('FloorStand_' + name + '_Mesh')
        data.from_pydata(verts, [], faces)
        data.update()
        obj = bpy.data.objects.new('FloorStand_' + name, data)
        scene.collection.objects.link(obj)
        obj.parent = root
        data.materials.append(mat)
        if bevel:
            mod = obj.modifiers.new('Machined edge', 'BEVEL')
            mod.width = bevel
            mod.segments = 1
            mod.limit_method = 'ANGLE'
        return obj

    def box(name, center, dims, mat, bevel=0):
        x, y, z = (d * .5 for d in dims)
        obj = mesh(name, [(-x,-y,-z), (x,-y,-z), (x,y,-z), (-x,y,-z),
                          (-x,-y,z), (x,-y,z), (x,y,z), (-x,y,z)],
                   [(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),
                    (3,0,4,7),(4,5,6,7)], mat, bevel)
        obj.location = center
        return obj

    def cylinder(name, start, end, radius, mat, sides=24, end_radius=None, bevel=0):
        start, end = Vector(start), Vector(end)
        length = (end-start).length
        verts = []
        for r, z in [(radius,-length*.5),
                     (radius if end_radius is None else end_radius,length*.5)]:
            verts += [(r*math.cos(2*math.pi*i/sides),
                       r*math.sin(2*math.pi*i/sides),z) for i in range(sides)]
        faces = [tuple(reversed(range(sides))),tuple(range(sides,sides*2))]
        faces += [(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
        obj = mesh(name, verts, faces, mat, bevel)
        obj.location = (start+end)*.5
        obj.rotation_mode = 'QUATERNION'
        obj.rotation_quaternion = (end-start).to_track_quat('Z','Y')
        for polygon in obj.data.polygons[2:]:
            polygon.use_smooth = True
        return obj

    def beam(name, start, end, width, depth, mat, bevel=.0007):
        start, end = Vector(start), Vector(end)
        obj = box(name, (start+end)*.5, (width,depth,(end-start).length), mat, bevel)
        obj.rotation_mode = 'QUATERNION'
        obj.rotation_quaternion = (end-start).to_track_quat('Z','Y')
        return obj

    # Center ends above the ground; the three separate feet carry the stand.
    cylinder('BottomCap',(0,0,.095),(0,0,.113),.0185,rubber)
    cylinder('LowerColumn',(0,0,.108),(0,0,.765),.0165,metal,sides=32)
    cylinder('MiddleColumn',(0,0,.747),(0,0,1.120),.0135,metal,sides=28)
    cylinder('UpperColumn',(0,0,1.103),(0,0,1.382),.0108,metal,sides=28)
    cylinder('LegHub',(0,0,.476),(0,0,.552),.032,shell,sides=32,bevel=.0015)
    cylinder('HubTopRedRing',(0,0,.551),(0,0,.554),.0285,red,sides=32)
    cylinder('SlidingBraceHub',(0,0,.181),(0,0,.221),.027,shell,sides=28,bevel=.001)

    for index, angle in enumerate((-math.pi/2,math.pi/6,5*math.pi/6),1):
        radial = Vector((math.cos(angle),math.sin(angle),0))
        tangent = Vector((-math.sin(angle),math.cos(angle),0))
        high = radial*.030 + Vector((0,0,.516))
        low = radial*.428 + Vector((0,0,.028))
        beam('Leg_%d'%index, high, low, .030, .022, metal,.001)
        # A soft inset above each foot echoes the small MT09's molded grip.
        legdir = (low-high).normalized()
        beam('LegInset_%d'%index,
             high+(low-high)*.47+Vector((0,0,.003)),
             high+(low-high)*.91+Vector((0,0,.003)),
             .031,.012,grip,.001)
        toe = box('RubberFoot_%d'%index,radial*.440+Vector((0,0,.013)),
                  (.060,.042,.026),rubber,.006)
        toe.rotation_euler.z = angle
        toe['ground_contact'] = True
        # Triangulated support braces prevent the tall stand reading as spindly.
        brace_start = radial*.025+Vector((0,0,.200))
        brace_end = high+(low-high)*.56
        beam('Brace_%d'%index,brace_start,brace_end,.013,.008,shell,.0005)
        for label, center, radius, span in [('Pivot',high,.009,.038),
                                           ('BracePivot',brace_end,.005,.028)]:
            cylinder('%s_%d'%(label,index),center-tangent*span*.5,
                     center+tangent*span*.5,radius,shell,sides=16)
            cylinder('%sScrew_%d'%(label,index),center+tangent*span*.5,
                     center+tangent*(span*.5+.001),radius*.51,steel,sides=8)

    for index, z, r in [(1,.744,.021),(2,1.10,.018)]:
        cylinder('LockCollar_%d'%index,(0,0,z-.017),(0,0,z+.020),r,shell,28,bevel=.001)
        cylinder('RedCollarBand_%d'%index,(0,0,z+.018),(0,0,z+.021),r*.98,red,28)
        lever = box('LockLever_%d'%index,(r+.009,-.002,z+.001),(.025,.017,.028),shell,.003)
        lever.rotation_euler.y = -.20
        cylinder('LeverPin_%d'%index,(r+.010,-.009,z+.003),
                 (r+.010,-.010,z+.003),.004,steel,12)

    # Five alternating fingers make the adapter distinct from a ball head.
    cylinder('HeadCollar',(0,0,1.377),(0,0,1.384),.018,shell,28,bevel=.001)
    cylinder('HeadAccent',(0,0,1.384),(0,0,1.386),.0178,red,28)
    pivot_z = 1.401

    def finger(name,x,width,bottom,inverted):
        r = .0071
        outline = [(r,bottom),(-r,bottom)] if inverted else [(-r,bottom),(r,bottom)]
        for i in range(9):
            a = (math.pi if inverted else 0)+math.pi*i/8
            outline.append((r*math.cos(a),pivot_z+r*math.sin(a)))
        n = len(outline)
        verts = [(x-width*.5,y,z) for y,z in outline]+[(x+width*.5,y,z) for y,z in outline]
        faces = [tuple(reversed(range(n))),tuple(range(n,n*2))]
        faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        mesh(name,verts,faces,shell,.0005)

    for i,x in enumerate((-.0072,0,.0072)):
        finger('GoProFinger_%d'%i,x,.0032,1.383,False)
    for i,x in enumerate((-.0036,.0036)):
        finger('AdapterFinger_%d'%i,x,.0029,1.425,True)
    cylinder('ThumbAxle',(-.013,0,pivot_z),(.038,0,pivot_z),.0029,steel,20)
    cylinder('ThumbSleeve',(.012,0,pivot_z),(.035,0,pivot_z),.0054,shell,20)
    cylinder('ThumbGrip',(.033,0,pivot_z),(.044,0,pivot_z),.010,shell,8,bevel=.0014)
    cylinder('HexNut',(-.014,0,pivot_z),(-.011,0,pivot_z),.005,steel,6)
    cylinder('MountPlatform',(0,0,1.424),(0,0,1.429),.018,shell,32,bevel=.0007)
    cylinder('MountRubber',(0,0,1.429),(0,0,1.430),.0165,rubber,32)
    cylinder('QuarterInchStud',(0,0,1.4298),(0,0,1.436),.003175,steel,20)
    return root
